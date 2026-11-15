# NATHA META OS

NATHA META OS is the GKFXL Instagram operations workspace.

## Current implementation

- React + TypeScript + Vite dashboard, served as Cloudflare Worker static assets.
- Supabase Auth sign-in and account creation.
- First-login GKFXL workspace bootstrap using the existing organization and membership RLS policies.
- Authenticated reads for Instagram accounts, conversations, messages, automation settings, and approvals.
- Approval queue with owner/admin review permissions and database-side guards against client-forged `sent` states.
- Draft post creation stored in the approval queue.
- Existing `natha-ai` Worker and webhook preserved. Outbound Instagram auto-replies are paused until the approval sender is implemented and tested.

## Local development

Run `npm install` and `npm run dev`.

The Supabase URL and publishable key in `src/lib/supabase.ts` are public client configuration. Never place the Supabase secret/service key, Meta App Secret, Instagram access token, or encryption key in frontend code.

## Data and security

- NATHA data is tenant-scoped by `organization_id` and Supabase Row Level Security.
- The first authenticated user without a NATHA membership can create the GKFXL workspace through the existing owner-only policies.
- OAuth state and approval queue schema migrations are in `supabase/migrations`.
- OAuth token encryption, Meta Login callback, live send API, media publishing, and Insights ingestion remain gated until their backend routes and required server-side configuration are complete.
- No outbound DM or post should be sent/published without an explicit approval action.
- Do not expose the existing Worker `/chat` route without authentication, authorization, and rate limiting.

## Verification

GitHub Actions runs the TypeScript/Vite production build for pushes and pull requests. A successful build does not by itself verify Meta OAuth, webhook delivery, or Instagram publishing; those require end-to-end tests with an authorized professional account.
