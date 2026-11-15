# NATHA META OS — production readiness

## Current branch
This branch expands the dashboard UI while preserving the existing landing page and the separate `natha-ai` Worker.

## What this change implements
- Responsive workspace navigation for overview, inbox, Instagram accounts, AI assistant, knowledge base, analytics, customers, and settings.
- Searchable sample inbox with explicit demo-only sending behavior.
- Local preview controls for AI tone, language, approval requirement, and knowledge topics.
- Empty states that avoid presenting sample metrics as real business data.
- Clear preview warnings and integration prerequisites.

## Not yet production-connected
The dashboard does not yet provide secure sign-in, Meta OAuth, tenant isolation, persistent business data, a live inbox, or live analytics. UI controls are local preview state only. No Instagram messages are sent by this frontend.

## Required production architecture
1. Customer authentication with secure server-managed sessions and role-based access.
2. Tenant-scoped D1 schema for organizations, members, Instagram accounts, conversations, messages, knowledge sources, and audit events.
3. Meta OAuth authorization-code flow on the server. Store access tokens only as encrypted server-side secrets/data; never expose them to the browser.
4. Webhook signature verification, idempotent event ingestion, tenant/account mapping, and retry-safe processing.
5. A backend API that enforces authentication, tenant membership, CSRF protection, rate limits, and ownership checks on every request.
6. AI reply generation with prompt-injection defenses, allowed messaging windows, opt-out handling, human approval by default, and audit logs.
7. Meta App Review / Advanced Access and live account-level webhook subscription before onboarding external customers.

## Existing services and constraints
- Existing `natha-ai` Worker must remain untouched during this UI phase.
- Existing `natha-meta-os` Worker currently serves the frontend assets.
- Cloudflare account currently has no D1 databases; the existing `NATHA_META_STATE` KV namespace is not modified by this branch.
- Do not reuse the GKFXL access token for other customers.
- Keep all app secrets out of GitHub and frontend build variables.
