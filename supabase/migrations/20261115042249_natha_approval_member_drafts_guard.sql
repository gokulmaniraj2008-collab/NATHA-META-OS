-- Permit workspace owners/admins to create approval drafts, while preventing
-- authenticated clients from marking anything as sent or changing payloads.
create policy natha_approvals_owner_admin_insert on public.natha_approvals for insert to authenticated
with check (exists (select 1 from public.natha_memberships m where m.organization_id = natha_approvals.organization_id and m.user_id = (select auth.uid()) and m.role in ('owner','admin')));
create or replace function public.natha_guard_approval_updates()
returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  if current_user <> 'service_role' then
    if new.status not in ('approved','rejected')
       or new.payload is distinct from old.payload
       or new.recipient_id is distinct from old.recipient_id
       or new.kind is distinct from old.kind
       or new.organization_id is distinct from old.organization_id
       or new.instagram_account_id is distinct from old.instagram_account_id
       or new.conversation_id is distinct from old.conversation_id
       or new.source_event_id is distinct from old.source_event_id
       or new.sent_at is distinct from old.sent_at
       or new.error_message is distinct from old.error_message then
      raise exception 'Approval records can only be approved or rejected by workspace members.';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists natha_approval_update_guard on public.natha_approvals;
create trigger natha_approval_update_guard before update on public.natha_approvals for each row execute function public.natha_guard_approval_updates();
