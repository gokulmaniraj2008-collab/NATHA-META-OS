const API_VERSION = "v27.0";
const SUPABASE_URL = "https://bqrpgtxtmatxwtdpuoyh.supabase.co";
const SITE_URL = "https://natha-meta-os.gokulmaniraj2008.workers.dev";
const CALLBACK_URL = "https://natha-ai.gokulmaniraj2008.workers.dev/oauth/callback";
const IG_SCOPES = ["instagram_business_basic", "instagram_business_manage_messages"];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "Content-Type,Authorization" } });
}
function headers(env, extra = {}) { return { apikey: env.SUPABASE_SECRET_KEY, Authorization: "Bearer " + env.SUPABASE_SECRET_KEY, "Content-Type": "application/json", Prefer: "return=representation", ...extra }; }
async function db(path, env, options = {}) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/" + path, { ...options, headers: headers(env, options.headers || {}) });
  const raw = await response.text(); let data; try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) throw new Error("Database request failed (" + response.status + "): " + (data?.message || data?.hint || "unknown"));
  return data;
}
function b64(bytes) { let s = ""; for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b); return btoa(s); }
function unb64(value) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
async function cryptoKey(env, usages) {
  const material = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("NATHA_META_OS_TOKEN_ENCRYPTION_V1:" + env.SUPABASE_SECRET_KEY));
  return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, usages);
}
async function encryptToken(token, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12)), key = await cryptoKey(env, ["encrypt"]);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token));
  return "v1." + b64(iv) + "." + b64(cipher);
}
async function decryptToken(value, env) {
  const [version, iv, cipher] = String(value || "").split(".");
  if (version !== "v1" || !iv || !cipher) throw new Error("Stored Instagram token format is invalid.");
  const key = await cryptoKey(env, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(cipher));
  return new TextDecoder().decode(plain);
}
function redirect(params) { const u = new URL(SITE_URL); for (const [k,v] of Object.entries(params)) u.searchParams.set(k, String(v)); return Response.redirect(u.toString(), 302); }
function hex(bytes) { return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2,"0")).join(""); }
async function verifySignature(body, signature, secret) {
  if (!signature?.startsWith("sha256=") || !secret) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, body)), supplied = signature.slice(7).toLowerCase();
  if (expected.length !== supplied.length) return false;
  let diff = 0; for (let i=0;i<expected.length;i++) diff |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}
async function currentUser(request, env) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const response = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { apikey: env.SUPABASE_SECRET_KEY, Authorization: authorization } });
  return response.ok ? response.json() : null;
}
async function startOAuth(request, env) {
  if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET || !env.SUPABASE_SECRET_KEY) return json({ error: "Instagram Login server settings are incomplete." }, 503);
  const user = await currentUser(request, env); if (!user) return json({ error: "Sign in to NATHA META OS first." }, 401);
  const body = await request.json().catch(() => ({})), org = body.organization_id;
  if (typeof org !== "string" || !/^[0-9a-f-]{36}$/i.test(org)) return json({ error: "A valid workspace is required." }, 400);
  const memberships = await db("natha_memberships?select=organization_id,role&organization_id=eq." + encodeURIComponent(org) + "&user_id=eq." + encodeURIComponent(user.id) + "&limit=1", env);
  if (!memberships?.length || !["owner","admin"].includes(memberships[0].role)) return json({ error: "Only a workspace owner or admin can connect Instagram." }, 403);
  const state = [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,"0")).join("");
  const stateHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(state)));
  await db("natha_oauth_states", env, { method: "POST", body: JSON.stringify({ state_hash: stateHash, user_id: user.id, organization_id: org, redirect_uri: CALLBACK_URL, expires_at: new Date(Date.now()+600000).toISOString() }) });
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", env.INSTAGRAM_APP_ID);
  url.searchParams.set("redirect_uri", CALLBACK_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", IG_SCOPES.join(","));
  url.searchParams.set("state", state);
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");
  return json({ authorization_url: url.toString() });
}
async function finishOAuth(request, env) {
  const url = new URL(request.url), code = url.searchParams.get("code"), state = url.searchParams.get("state");
  if (url.searchParams.has("error")) return redirect({ instagram_oauth: "error", reason: "meta_denied" });
  if (!code || !state || !env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET) return redirect({ instagram_oauth: "error", reason: "missing_code_or_config" });
  const stateHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(state)));
  const rows = await db("natha_oauth_states?select=*&state_hash=eq." + stateHash + "&expires_at=gt." + encodeURIComponent(new Date().toISOString()) + "&consumed_at=is.null&limit=1", env);
  const saved = rows?.[0]; if (!saved) return redirect({ instagram_oauth: "error", reason: "state_expired_or_used" });
  const consumed = await db("natha_oauth_states?state_hash=eq." + stateHash + "&consumed_at=is.null&select=state_hash", env, { method: "PATCH", body: JSON.stringify({ consumed_at: new Date().toISOString() }) });
  if (!consumed?.length) return redirect({ instagram_oauth: "error", reason: "state_used" });
  const form = new FormData();
  form.set("client_id", env.INSTAGRAM_APP_ID); form.set("client_secret", env.INSTAGRAM_APP_SECRET);
  form.set("grant_type", "authorization_code"); form.set("redirect_uri", CALLBACK_URL); form.set("code", code);
  const shortResponse = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body: form });
  const shortData = await shortResponse.json(); if (!shortResponse.ok || !shortData.access_token) return redirect({ instagram_oauth: "error", reason: "token_exchange" });
  const longUrl = new URL("https://graph.instagram.com/access_token");
  longUrl.searchParams.set("grant_type", "ig_exchange_token"); longUrl.searchParams.set("client_secret", env.INSTAGRAM_APP_SECRET); longUrl.searchParams.set("access_token", shortData.access_token);
  const longResponse = await fetch(longUrl), longData = await longResponse.json();
  if (!longResponse.ok || !longData.access_token) return redirect({ instagram_oauth: "error", reason: "long_token_exchange" });
  const accessToken = longData.access_token;
  const profileUrl = new URL("https://graph.instagram.com/" + API_VERSION + "/me");
  profileUrl.searchParams.set("fields", "user_id,username"); profileUrl.searchParams.set("access_token", accessToken);
  const profileResponse = await fetch(profileUrl), profile = await profileResponse.json();
  if (!profileResponse.ok || !(profile.user_id || profile.id)) return redirect({ instagram_oauth: "error", reason: "profile_lookup" });
  const instagramId = String(profile.user_id || profile.id), encrypted = await encryptToken(accessToken, env);
  const existing = await db("natha_instagram_accounts?select=id&organization_id=eq." + encodeURIComponent(saved.organization_id) + "&instagram_user_id=eq." + encodeURIComponent(instagramId) + "&limit=1", env);
  const row = { organization_id: saved.organization_id, instagram_user_id: instagramId, username: profile.username || instagramId, status: "connected", token_ciphertext: encrypted, token_expires_at: new Date(Date.now()+(Number(longData.expires_in)||5184000)*1000).toISOString(), granted_scopes: IG_SCOPES, connected_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  if (existing?.length) await db("natha_instagram_accounts?id=eq." + encodeURIComponent(existing[0].id), env, { method: "PATCH", body: JSON.stringify(row) });
  else await db("natha_instagram_accounts", env, { method: "POST", body: JSON.stringify(row) });
  return redirect({ instagram_oauth: "connected", accounts: 1 });
}
async function generateReply(message, env) {
  const result = await env.AI.run("@cf/google/gemma-4-26b-a4b-it", { messages: [
    { role:"system", content:"You are NATHA AI, a helpful Instagram customer-support assistant. Reply in the same language (Tamil, Tanglish, or English). Be concise and friendly. Never invent prices, availability, order/payment/delivery status. Ask the page owner when information is unknown. Return only the reply text." },
    { role:"user", content: message.slice(0,4000) }
  ]});
  return String(result?.choices?.[0]?.message?.content || result?.response || "Thanks for your message. Our team will get back to you shortly.").slice(0,900);
}
async function processInstagramEvent(payload, env) {
  if (!env.AI) return;
  for (const entry of payload?.entry || []) {
    const instagramId = String(entry?.id || "");
    const accountRows = await db("natha_instagram_accounts?select=id,organization_id,username&instagram_user_id=eq." + encodeURIComponent(instagramId) + "&status=eq.connected&limit=1", env);
    const account = accountRows?.[0]; if (!account) continue;
    const events = [];
    for (const item of entry?.messaging || []) events.push({ sender:item?.sender?.id, recipient:item?.recipient?.id, message:item?.message, timestamp:item?.timestamp });
    for (const change of entry?.changes || []) if (change?.field === "messages") { const v=change.value||{}; events.push({ sender:v.sender?.id, recipient:v.recipient?.id, message:v.message, timestamp:v.timestamp }); }
    for (const event of events) {
      const sender = String(event.sender || ""), recipient = String(event.recipient || ""), msg = event.message || {};
      const body = typeof msg.text === "string" && msg.text.trim() ? msg.text.trim() : (msg.attachments?.length ? "[Customer sent an attachment]" : "");
      const messageId = String(msg.mid || msg.id || "");
      if (!sender || !messageId || !body || msg.is_echo || sender === instagramId || recipient !== instagramId) continue;
      const timestampMs = Number(event.timestamp || Date.now()); const eventDate = new Date(timestampMs < 1e12 ? timestampMs*1000 : timestampMs);
      if (!Number.isFinite(eventDate.getTime())) continue;
      const conversationRows = await db("natha_conversations?on_conflict=instagram_account_id,ig_scoped_user_id", env, { method:"POST", headers:{Prefer:"resolution=merge-duplicates,return=representation"}, body:JSON.stringify({ organization_id:account.organization_id, instagram_account_id:account.id, ig_scoped_user_id:sender, status:"open", last_message_at:eventDate.toISOString(), updated_at:new Date().toISOString() }) });
      const conversation = conversationRows?.[0]; if (!conversation) continue;
      const savedMessages = await db("natha_messages?on_conflict=external_message_id", env, { method:"POST", headers:{Prefer:"resolution=ignore-duplicates,return=representation"}, body:JSON.stringify({ organization_id:account.organization_id, conversation_id:conversation.id, external_message_id:messageId, direction:"inbound", sender_id:sender, body, delivery_status:"received", sent_at:eventDate.toISOString() }) });
      try {
        const suggestion = await generateReply(body, env);
        const expiresAt = new Date(eventDate.getTime()+24*60*60*1000).toISOString();
        await db("natha_approvals?on_conflict=organization_id,source_event_id", env, { method:"POST", headers:{Prefer:"resolution=ignore-duplicates,return=representation"}, body:JSON.stringify({ organization_id:account.organization_id, instagram_account_id:account.id, conversation_id:conversation.id, source_event_id:messageId, kind:"dm_reply", recipient_id:sender, payload:{ message:suggestion, inbound_message:body, inbound_at:eventDate.toISOString() }, status:"pending", expires_at:expiresAt }) });
      } catch (error) { console.error("AI approval draft failed", String(error)); }
    }
  }
}
async function sendApprovedDm(request, env, approvalId) {
  const user = await currentUser(request, env); if (!user) return json({ error:"Sign in again before sending." },401);
  const rows = await db("natha_approvals?select=*&id=eq."+encodeURIComponent(approvalId)+"&limit=1",env), approval=rows?.[0];
  if (!approval || approval.kind !== "dm_reply") return json({error:"DM approval was not found."},404);
  const members = await db("natha_memberships?select=role&organization_id=eq."+encodeURIComponent(approval.organization_id)+"&user_id=eq."+encodeURIComponent(user.id)+"&limit=1",env);
  if (!members?.length || !["owner","admin"].includes(members[0].role)) return json({error:"Only a workspace owner or admin can send approved replies."},403);
  if (approval.status !== "approved") return json({error:"Approve this reply first. Only approved replies can be sent."},409);
  if (!approval.recipient_id || !approval.payload?.message) return json({error:"The approved reply is missing its recipient or message."},422);
  if (!approval.expires_at || new Date(approval.expires_at).getTime() <= Date.now()) return json({error:"The Instagram messaging reply window has expired."},410);
  const claimed = await db("natha_approvals?id=eq."+encodeURIComponent(approvalId)+"&status=eq.approved&select=id",env,{method:"PATCH",body:JSON.stringify({status:"sending",reviewed_by:user.id,reviewed_at:new Date().toISOString()})});
  if (!claimed?.length) return json({error:"This reply is already being processed or is no longer approved."},409);
  try {
    const accounts = await db("natha_instagram_accounts?select=id,instagram_user_id,token_ciphertext,token_expires_at&id=eq."+encodeURIComponent(approval.instagram_account_id)+"&organization_id=eq."+encodeURIComponent(approval.organization_id)+"&status=eq.connected&limit=1",env);
    const account = accounts?.[0]; if (!account?.token_ciphertext) throw new Error("Connected Instagram token is unavailable.");
    if (account.token_expires_at && new Date(account.token_expires_at).getTime() <= Date.now()) throw new Error("Instagram access token has expired. Reconnect the account.");
    const token = await decryptToken(account.token_ciphertext,env);
    const endpoint = "https://graph.instagram.com/"+API_VERSION+"/"+encodeURIComponent(account.instagram_user_id)+"/messages";
    const response = await fetch(endpoint,{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({recipient:{id:approval.recipient_id},message:{text:String(approval.payload.message).slice(0,900)}})});
    const result = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error("Instagram Send API rejected the message ("+response.status+").");
    await db("natha_approvals?id=eq."+encodeURIComponent(approvalId),env,{method:"PATCH",body:JSON.stringify({status:"sent",sent_at:new Date().toISOString(),error_message:null})});
    await db("natha_messages",env,{method:"POST",headers:{Prefer:"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify({organization_id:approval.organization_id,conversation_id:approval.conversation_id,external_message_id:result.message_id||("natha:"+approvalId),direction:"outbound",sender_id:account.instagram_user_id,body:String(approval.payload.message),delivery_status:"sent",sent_at:new Date().toISOString()})});
    return json({sent:true});
  } catch(error) {
    await db("natha_approvals?id=eq."+encodeURIComponent(approvalId),env,{method:"PATCH",body:JSON.stringify({status:"failed",error_message:String(error).slice(0,500)})});
    return json({error:String(error).slice(0,500)},502);
  }
}
export default {
 async fetch(request,env,ctx) {
  const url=new URL(request.url);
  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:{"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"Content-Type,Authorization"}});
  if(url.pathname==="/oauth/start"&&request.method==="POST"){try{return await startOAuth(request,env);}catch(e){console.error("OAuth start",String(e));return json({error:"Could not start Instagram Login. Check the app ID, secret and database configuration."},500);}}
  if(url.pathname==="/oauth/callback"&&request.method==="GET"){try{return await finishOAuth(request,env);}catch(e){console.error("OAuth callback",String(e));return redirect({instagram_oauth:"error",reason:"callback_failed"});}}
  if(url.pathname==="/webhook"&&request.method==="GET"){
    const mode=url.searchParams.get("hub.mode"),token=url.searchParams.get("hub.verify_token"),challenge=url.searchParams.get("hub.challenge");
    if(mode==="subscribe"&&token&&token===env.NATHA_VERIFY_TOKEN&&challenge)return new Response(challenge,{status:200,headers:{"content-type":"text/plain"}});
    return new Response("Forbidden",{status:403});
  }
  if(url.pathname==="/webhook"&&request.method==="POST"){
    if(!env.INSTAGRAM_APP_SECRET)return json({error:"Webhook secret is not configured."},503);
    const raw=await request.arrayBuffer();
    if(!await verifySignature(raw,request.headers.get("X-Hub-Signature-256"),env.INSTAGRAM_APP_SECRET))return json({error:"Invalid webhook signature."},401);
    let payload;try{payload=JSON.parse(new TextDecoder().decode(raw));}catch{return json({error:"Invalid JSON."},400);}
    ctx.waitUntil(processInstagramEvent(payload,env).catch(e=>console.error("Webhook processing",String(e))));
    return json({received:true});
  }
  const sendMatch=url.pathname.match(/^\/approvals\/([0-9a-f-]{36})\/send$/i);
  if(sendMatch&&request.method==="POST"){try{return await sendApprovedDm(request,env,sendMatch[1]);}catch(e){console.error("Approved DM send",String(e));return json({error:"Could not process the approved reply."},500);}}
  if(url.pathname==="/health"&&request.method==="GET")return json({bot:"NATHA AI",status:"online",instagram_login_configured:Boolean(env.INSTAGRAM_APP_ID&&env.INSTAGRAM_APP_SECRET&&env.SUPABASE_SECRET_KEY),webhook_configured:Boolean(env.NATHA_VERIFY_TOKEN&&env.INSTAGRAM_APP_SECRET&&env.SUPABASE_SECRET_KEY),approval_sender:"approval-gated"});
  if(url.pathname!=="/chat"||request.method!=="POST")return json({bot:"NATHA AI",status:"online",message:"NATHA META OS API"});
  if(!env.AI)return json({error:"Workers AI is not configured."},503);
  const auth=request.headers.get("Authorization")||"",expected=env.NATHA_API_KEY?"Bearer "+env.NATHA_API_KEY:"";
  if(!expected||auth!==expected)return json({error:"Authentication required."},401);
  const body=await request.json().catch(()=>({}));if(typeof body.message!=="string"||!body.message.trim())return json({error:"A message is required."},400);
  return json({bot:"NATHA AI",reply:await generateReply(body.message,env)});
 }
};
