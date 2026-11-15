-- NATHA META OS: claim an explicitly approved DM before sending to prevent double sends.
alter table public.natha_approvals drop constraint if exists natha_approvals_status_check;
alter table public.natha_approvals add constraint natha_approvals_status_check
  check (status in ('pending','approved','rejected','sending','sent','failed','expired'));
