const SUPABASE_URL = "https://bqrpgtxtmatxwtdpuoyh.supabase.co";
const SUPABASE_KEY = "sb_publishable_Dl_Fltbnshhahd9rbkMgxw_NPtn4pM5";
const SESSION_KEY = "natha.session.v1";

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  token_type?: string;
};

export type AuthUser = {
  id: string;
  email?: string;
};

export type DbRow = Record<string, unknown>;

function headers(token?: string, extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.msg || body?.message || body?.error_description || body?.error || `Request failed (${response.status})`;
    throw new Error(String(message));
  }
  return body as T;
}

export async function signIn(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: headers(undefined, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
  });
  const result = await readJson<AuthSession & { expires_in?: number }>(response);
  if (!result.expires_at && result.expires_in) result.expires_at = Math.floor(Date.now() / 1000) + result.expires_in;
  return result;
}

export async function signUp(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: headers(undefined, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
  });
  const result = await readJson<Partial<AuthSession> & { user?: AuthUser; expires_in?: number }>(response);\n  if (result.access_token && result.refresh_token && !result.expires_at && result.expires_in) result.expires_at = Math.floor(Date.now() / 1000) + result.expires_in;\n  return result;
}

export async function refreshSession(session: AuthSession) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: headers(undefined, { "Content-Type": "application/json" }),
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const next = await readJson<AuthSession & { expires_in?: number }>(response);
  if (!next.expires_at && next.expires_in) next.expires_at = Math.floor(Date.now() / 1000) + next.expires_in;
  saveSession(next);
  return next;
}

export function saveSession(session: AuthSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function getSession(): Promise<AuthSession | null> {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.access_token || !session.refresh_token) return null;
    if (session.expires_at && session.expires_at * 1000 < Date.now() + 60_000) {
      return await refreshSession(session);
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export async function getUser(session: AuthSession) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: headers(session.access_token),
  });
  return readJson<AuthUser>(response);
}

export async function dbRequest<T = DbRow[]>(
  table: string,
  query: Record<string, string>,
  session: AuthSession,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const activeSession = session.expires_at && session.expires_at * 1000 < Date.now() + 60_000 ? await refreshSession(session) : session;\n  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    method,
    headers: headers(activeSession.access_token, {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return readJson<T>(response);
}

export async function signOut(session: AuthSession) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: headers(session.access_token),
  }).catch(() => undefined);
  clearSession();
}

export async function ensureWorkspace(session: AuthSession, user: AuthUser) {
  const memberships = await dbRequest<Array<{ organization_id: string; role: string }>>(
    "natha_memberships",
    { select: "organization_id,role", user_id: `eq.${user.id}`, limit: "1" },
    session,
  );
  if (memberships.length) return memberships[0].organization_id;

  const created = await dbRequest<Array<{ id: string }>>(
    "natha_organizations",
    { select: "id" },
    session,
    "POST",
    { name: "GKFXL Workspace", created_by: user.id },
  );
  const organizationId = created[0]?.id;
  if (!organizationId) throw new Error("Workspace could not be created.");
  await dbRequest("natha_memberships", { select: "organization_id" }, session, "POST", {
    organization_id: organizationId,
    user_id: user.id,
    role: "owner",
  });
  return organizationId;
}

export const backendUrl = "https://natha-ai.gokulmaniraj2008.workers.dev";
