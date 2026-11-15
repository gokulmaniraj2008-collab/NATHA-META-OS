# NATHA META OS

An AI-powered Instagram messaging platform with a public SaaS website and a private customer workspace.

## Project status

**Phase 1 — Frontend foundation.** This repository contains the public website and a non-production dashboard preview. Instagram OAuth, customer authentication, tenant data storage, and live messaging are not yet connected.

## Architecture

- **Frontend:** React + TypeScript + Vite
- **Hosting target:** Cloudflare Pages
- **Existing backend:** Cloudflare Worker `natha-ai` (preserved; not modified by this repository setup)
- **Instagram integration:** Meta's official Instagram APIs, with each customer authorizing their own account

## Local development

```bash
npm install
npm run dev
```

## Security

- Never commit access tokens, app secrets, passwords, or customer data.
- Do not use the GKFXL Instagram access token for other customers.
- Public dashboard screens are UI previews only until authentication and per-customer authorization are implemented.
- Do not expose the existing Worker `/chat` route publicly without authentication, authorization, and rate limiting.

## Next phases

1. Complete responsive public website and dashboard UI.
2. Add secure customer authentication and tenant isolation.
3. Implement Meta OAuth and per-customer token storage.
4. Add authenticated API gateway routes and connect the existing Worker safely.
5. Configure Cloudflare Pages deployment and test end-to-end messaging.


## Expanded workspace preview

The feature branch adds navigation for Overview, Inbox, Instagram Accounts, AI Assistant, Knowledge Base, Analytics, Customers, and Settings. All unconnected features are visibly marked as preview-only; no sample inbox message is sent and no fake metrics are presented as live data. See [production readiness](docs/PRODUCTION_READINESS.md) before enabling customer-facing integrations.
