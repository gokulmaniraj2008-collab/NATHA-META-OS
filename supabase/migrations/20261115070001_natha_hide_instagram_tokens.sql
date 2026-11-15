-- Never expose encrypted Instagram access tokens to browser-authenticated users.
-- The Worker uses the service role; the frontend only needs these safe profile fields.
revoke all on table public.natha_instagram_accounts from anon, authenticated;
grant select (id, organization_id, instagram_user_id, username, status, token_expires_at, granted_scopes, connected_at, created_at, updated_at)
  on table public.natha_instagram_accounts to authenticated;
