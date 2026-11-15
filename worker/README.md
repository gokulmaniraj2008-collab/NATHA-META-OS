# NATHA AI Worker

This source is the version-controlled implementation for the existing `natha-ai` Cloudflare Worker. It must be reviewed and deployed separately from the frontend.

## Required bindings and secrets

Configure these on the `natha-ai` Worker in Cloudflare before deployment:

- **Variable** `INSTAGRAM_APP_ID`: Instagram Login app ID (the Instagram app ID, not the older Facebook app ID).
- **Secret** `INSTAGRAM_APP_SECRET`: matching Instagram app secret; also used to verify Meta webhook signatures.
- **Secret** `SUPABASE_SECRET_KEY`: Supabase server-side service-role secret. Never expose it to the browser or commit it.
- **Secret** `NATHA_VERIFY_TOKEN`: a long random value entered identically in Meta's webhook configuration.
- **Secret** `NATHA_API_KEY`: optional API key for the private `/chat` route.
- **AI binding** `AI`: Cloudflare Workers AI binding.

The existing `INSTAGRAM_APP_ID` variable and secrets should be checked by name only; never paste secret values into GitHub or chat. The legacy `META_APP_ID` is not used by this implementation and can remain untouched during migration.

## Meta app setup

1. Select **API setup with Instagram Login** in the Meta app, not Facebook Login or Unified Login.
2. Register exactly: `https://natha-ai.gokulmaniraj2008.workers.dev/oauth/callback`.
3. Request `instagram_business_basic` and `instagram_business_manage_messages`.
4. Configure the Instagram webhook object and subscribe to the `messages` field; callback URL: `https://natha-ai.gokulmaniraj2008.workers.dev/webhook`.
5. Enter the same `NATHA_VERIFY_TOKEN` in Meta. Keep the app in development mode for test-account validation until the required review and access are granted.

Meta's current Instagram Login API uses `graph.instagram.com`, does not require a Facebook Page, and uses the `instagram_business_*` permission family. See the [Meta Instagram API changelog](https://developers.facebook.com/docs/instagram/platform/instagram-api/changelog/) and [Instagram Messaging documentation](https://developers.facebook.com/documentation/business-messaging/instagram-messaging).

## Implemented server behavior

- Instagram Login OAuth with random one-time state and server-side encrypted long-lived token storage.
- Organization-owner/admin authorization for account connection.
- Webhook HMAC verification, inbound message persistence, duplicate-event handling, and AI reply drafts in `natha_approvals`.
- Explicitly approved DM send endpoint: `POST /approvals/:id/send`. It requires an authenticated owner/admin, approved state, a non-expired messaging window, and a connected account token.
- No automatic DM sending. No post publishing endpoint is enabled in this version.

## Release checklist

1. Apply the repository's pending Supabase migration `20261115070000_natha_approval_sending_state.sql`.
2. Verify all bindings by name and confirm the secrets exist without revealing their values.
3. Deploy this Worker only after the frontend and database migration are ready.
4. Test OAuth with an authorized Instagram professional test account.
5. Send a real DM only after the user explicitly approves a specific reply in NATHA.
6. Configure webhook fields and verify a real inbound test message creates a pending approval.

Do not enable production publishing until a secure media upload path, publishing permissions, approval checks, and end-to-end tests are implemented.
