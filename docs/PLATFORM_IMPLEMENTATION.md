# NATHA META OS — Platform implementation plan

## Verified starting point (15 Nov 2026)
- Public landing page loads and its phone layout is responsive.
- The dashboard is explicitly a preview. Sign-in and live Instagram connection are not enabled.
- Existing Instagram backend is a separate Cloudflare Worker named `natha-ai`. This project must not overwrite it.
- This repository currently contains the React + TypeScript + Vite frontend.

## Target architecture
- Public website: Cloudflare Pages (static frontend).
- Application API: a separate Cloudflare Worker for NATHA META OS; do not repurpose the existing `natha-ai` Worker.
- Database: Cloudflare D1 with workspace-scoped records.
- Sessions: opaque random session cookies; store only a cryptographic hash in D1. Cookies must be HttpOnly, Secure, and SameSite=Lax.
- Instagram: official Meta OAuth and messaging APIs, with each customer authorizing their own professional account.
- Secrets: Worker secrets only. Encrypt access tokens using Web Crypto AES-GCM before persisting ciphertext + IV in D1. Keep encryption key outside source control.
- Tenant isolation: every workspace-owned query must scope by authenticated workspace membership; never trust a workspace ID supplied by the browser without checking membership.

## Delivery phases
1. **Foundation:** database schema, API contracts, environment/secret inventory, security boundaries.
2. **Authentication:** sign-up/sign-in, email verification, session lifecycle, owner workspace creation, membership checks.
3. **Meta OAuth:** signed state, redirect validation, callback, account identity lookup, token encryption, disconnect/revoke handling.
4. **Inbox:** verified webhook signature, idempotent event ingestion, conversation/message list, pagination, status/assignment.
5. **AI assistant:** business knowledge retrieval, per-account tone/language, safety rules, rate limits, AI enable switch default OFF.
6. **Human approval:** outbound replies remain draft/approval-required by default; explicit operator approval before sending.
7. **Knowledge base:** CRUD, workspace-scoped content, import limits and sanitization.
8. **Analytics:** derived counts and response metrics; no cross-tenant aggregation.
9. **Operations:** audit events, webhook retries, observability, retention/deletion, abuse controls.
10. **Release:** Meta App Review/Advanced Access where required, production environment checks, mobile QA, end-to-end tests.

## Database
Migration `migrations/0001_platform_foundation.sql` establishes users, workspaces, memberships, sessions, OAuth state, encrypted Instagram account token fields, conversations, messages, reply settings, knowledge sources, and audit events.

## Required Worker bindings and secrets (configure only when the API Worker is created)
- D1 binding: `DB`
- Secrets: `SESSION_PEPPER`, `TOKEN_ENCRYPTION_KEY`, Meta app secret, and Meta app credentials as required by the selected Meta login product.
- Public config: canonical app origin, Meta OAuth redirect URI, Meta Graph API version.
- Do not put any of these secrets in Vite variables, GitHub files, browser storage, or client JavaScript.

## Safety / release gates
- No plaintext tokens in D1, logs, analytics, or responses.
- No public unauthenticated `/chat` or message-send route.
- Verify Meta webhook signatures before processing events.
- Enforce workspace membership on every API route.
- AI auto-replies remain OFF until explicitly enabled by a workspace owner; human approval remains ON by default.
- Respect Meta messaging permissions, supported conversation windows, app mode, tester roles, and App Review requirements.
- Do not claim that a feature is live until deployed and exercised end-to-end.

## Current limitations
This commit is a safe foundation, not a claim that authentication, OAuth, inbox, or live sending are already operational. Those require separate API implementation, Cloudflare resources/secrets, Meta configuration, and end-to-end tests.
