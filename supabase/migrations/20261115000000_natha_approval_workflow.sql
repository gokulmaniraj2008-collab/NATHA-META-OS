-- NATHA META OS: approval queue and one-time OAuth state storage.
-- The Worker uses the service role for webhook/OAuth writes. Authenticated users
-- can read their organization's queue; only owners/admins can change approval state.

create table if not exists public.natha_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.natha_organizations(id) on delete cascade,
  instagram_account_id uuid not null references public.natha_instagram_accounts(id) on delete cascade,
  conversation_id uuid references public.natha_conversations(id) on delete set null,
  source_event_id text,
  kind text not null check (kind in ('dm_reply','feed_post','reel','story')),
  recipient_id text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','sent','failed','expired')),
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  sent_at timestamptz,
  error_message text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint natha_approvals_source_event_unique unique (organization_id, source_event_id)
);

create index if not exists natha_approvals_org_status_created_idx
  on public.natha_approvals (organization_id, status, created_at desc);
create index if not exists natha_approvals_account_created_idx
  on public.natha_approvals (instagram_account_id, created_at desc);

alter table public.natha_approvals enable row level security;
drop policy if exists natha_approvals_member_read on public.natha_approvals;
create policy natha_approvals_member_read
  on public.natha_approvals for select to authenticated
  using (organization_id in (
    select m.organization_id from public.natha_memberships m
    where m.user_id = (select auth.uid())
  ));
drop policy if exists natha_approvals_owner_admin_update on public.natha_approvals;
create policy natha_approvals_owner_admin_update
  on public.natha_approvals for update to authenticated
  using (exists (
    select 1 from public.natha_memberships m
    where m.organization_id = natha_approvals.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  ))
  with check (exists (
    select 1 from public.natha_memberships m
    where m.organization_id = natha_approvals.organization_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  ));

create table if not exists public.natha_oauth_states (
  state_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.natha_organizations(id) on delete cascade,
  redirect_uri text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists natha_oauth_states_expiry_idx
  on public.natha_oauth_states (expires_at);
alter table public.natha_oauth_states enable row level security;
revoke all on public.natha_oauth_states from anon, authenticated;
grant all on public.natha_oauth_states to service_role;
