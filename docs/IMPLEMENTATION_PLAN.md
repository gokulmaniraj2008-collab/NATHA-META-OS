# NATHA META OS — implementation plan

## Safety baseline

- Keep all outbound Instagram DMs and content publishing disabled until a workspace owner explicitly approves each item.
- Never put Meta app secrets, Instagram access tokens, Supabase service-role keys, or encryption keys in browser code or Git.
- Keep the existing production `natha-ai` Worker untouched while the migration is developed and tested on this branch.
- Do not treat a successful frontend build or a healthy `/health` endpoint as proof that Meta OAuth, webhooks, messaging, or publishing works.

## Verified current state (2026-11-15)

- The website uses Supabase Auth and organization-scoped database reads.
- The approval table supports `dm_reply`, `feed_post`, `reel`, and `story` records.
- The website can create content drafts and review pending approvals.
- The Cloudflare Worker currently starts OAuth at `facebook.com/v27.0/dialog/oauth`, exchanges tokens through `graph.facebook.com`, and discovers Instagram accounts through Facebook Pages.
- The webhook handler currently generates an AI suggestion and logs that it is held; it does not insert a DM reply into `natha_approvals`.
- The website's approval action only changes the draft status. It does not send the DM or publish the post.
- The existing Worker source is deployed separately from this repository. It must be brought under version control before safe repeatable Worker releases.

## Target workflow

1. Instagram Login authorization using the Instagram App ID and matching App Secret, with a one-time OAuth state and exact registered callback URL.
2. Store the Instagram user token encrypted server-side, record granted scopes and expiry, and map the connected Instagram account to the correct NATHA organization.
3. Subscribe and verify Instagram messaging webhooks; validate request signatures and deduplicate inbound events.
4. Persist inbound messages and conversation records, then generate a language-matched AI reply suggestion.
5. Insert each suggestion into `natha_approvals` as `kind='dm_reply'`, `status='pending'`, with the recipient and source event ID. No send occurs at this stage.
6. On explicit owner/admin approval, a server-side sender rechecks organization ownership, approval state, recipient, token validity, messaging window and idempotency before sending. Record success or failure.
7. Add a separate approval-gated publishing pipeline for feed posts and Reels; upload media and publish only after approval and permission checks.
8. Add Insights ingestion and honest delivery/analytics status, then expand System Monitor with integration-level checks.

## External prerequisites

- Confirm the Meta app is configured for **API setup with Instagram Login**, not Unified Login or Facebook Login.
- Confirm the exact redirect URI registered in Meta is `https://natha-ai.gokulmaniraj2008.workers.dev/oauth/callback`.
- Configure the Instagram App ID and corresponding App Secret as Cloudflare server-side variables/secrets. The Instagram App ID supplied by the owner is `1174012708489501`; it must not be confused with the older Facebook App ID.
- Enable the required Instagram permissions, including `instagram_business_basic` and `instagram_business_manage_messages`; content publishing and insights require their own permissions.
- Complete Meta tester/account setup, app review/advanced access, and business verification requirements applicable to the intended production use.
- Apply and verify the database migrations in the connected Supabase project before enabling webhook writes.

## Release gates

- Build/type-check and automated tests pass on this branch.
- OAuth state replay, invalid signature, duplicate webhook, expired token, wrong-organization access, and send-without-approval tests pass.
- Test against an authorized Instagram professional test account.
- Confirm rejected/pending approvals cannot send; approved items send once only.
- Confirm production secrets and webhook subscriptions are configured without exposing their values.
- Review the pull request before merging; deploy the Worker separately only after explicit release approval.
