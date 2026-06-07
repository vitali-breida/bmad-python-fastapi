# ADR-004: CI/CD and HTTPS preview deployment

**Status:** Accepted — **complete** (Phases 1–3; 2026-06-07)  
**Date:** 2026-05-22  
**Preview:** https://bmad-python-fastapi.onrender.com/ (Neon Postgres; product v0.4.5)  
**Scope:** Continuous integration on GitHub Actions; manual preview deployment to Render with a single HTTPS origin; Neon Postgres persistence on preview. Authorization, split-origin SPA/API, and automatic deploy-on-every-push are out of scope.  
**Discussion:** Brainstorming session 2026-05-22 (CI/CD, one URL, free tier, persistence).

## Context

The Notes API project (FastAPI + SQLite locally + React/Vite UI + JWT auth per ADR-003) is mature enough for repeatable checks and a public demo URL. **v1 shipped:**

- GitHub Actions CI on push/PR to `main` (pytest, frontend lint/build, Playwright smoke).
- Preview on Render: https://bmad-python-fastapi.onrender.com/ (Docker: nginx + static UI + Uvicorn; manual deploy).
- Local dev still uses Vite on `http://127.0.0.1:5173` proxying `/notes` and `/auth` to Uvicorn on port 8000.
- Production-style hosting is documented in `project-context.md` as reverse proxy for `/notes` and `/auth` on the **same origin** as the static UI; CORS is not implemented.
- Demo persistence on ephemeral container disk (SQLite file) is unreliable across redeploys; managed Postgres is the intended fix when preview goes live with durable data.

**Constraints (agreed):** free tier services; public GitHub repo; demo data must eventually persist across redeploys; minimize moving parts (no separate FE and API domains).

## Decision

| Area | Choice |
|------|--------|
| **Phase 1** | **CI only** — no cloud deploy in the first implementation slice |
| **Phase 2** | **Manual CD** to **Render** Web Service (Docker: nginx + static `frontend/dist` + Uvicorn) |
| **Phase 3** | **Neon** managed **PostgreSQL** for preview `DATABASE_URL`; local dev stays SQLite unless explicitly changed |
| **Public URL** | **Single HTTPS origin** on Render (`https://<service>.onrender.com`) — nginx proxies `/notes` and `/auth` to the API; same relative paths as dev |
| **Split origins** | **Rejected** for v1 (no GitHub Pages + separate API URL; no CORS/`VITE_API_URL` work) |
| **CI triggers** | Push and pull requests to `main` (standard GitHub Actions) |
| **CD trigger** | **Manual** (Render dashboard deploy and/or `workflow_dispatch` later); auto-deploy on every `main` push deferred |
| **CI jobs (baseline)** | Backend: `python -m pytest`; Frontend: `npm ci`, `npm run lint`, `npm run build`; E2E: Playwright smoke (`login-app` shell; API not required per current spec) |
| **HTTPS** | Provided by Render when Phase 2 is live; CI does not expose a browser URL |
| **Secrets (preview)** | `SECRET_KEY`, `INITIAL_ADMIN_PASSWORD`, `ENVIRONMENT=production`; later `DATABASE_URL` (Neon); never commit to git |
| **Migrations on preview** | `alembic upgrade head` before or on container start when CD exists |
| **Postgres in code** | Deferred with Phase 3; Phase 2 may run on SQLite only if accept non-persistent demo data until Neon |

### Rationale

- **CI first** delivers value without Neon/Render accounts, secrets, or Docker in the first PR.
- **One origin** matches ADR-003 frontend rules (relative `/notes`, `/auth`; `authFetch`) and avoids CORS work called out as out-of-scope in `project-context.md`.
- **Render** chosen for straightforward GitHub-linked Web Service and automatic TLS on `*.onrender.com`.
- **Neon deferred (Phase 3)** keeps Phase 1–2 smaller; team accepts that preview without Postgres may lose SQLite data on redeploy until Phase 3.
- **Manual CD** reduces risk of broken public demo on every `main` push while learning the stack.

## Environments

| Environment | Host | Database | TLS (browser) | Purpose |
|-------------|------|----------|---------------|---------|
| **Local** | Developer machine | SQLite (`notes.db`), `.env` | No (`http://127.0.0.1`) | Day-to-day development |
| **CI** | GitHub Actions runners | In-memory SQLite via test overrides | N/A | Automated checks on PR/push |
| **Preview** | Render | Neon Postgres (`DATABASE_URL`) | Yes (Render-managed) | HTTPS demo link |

CI is not a fourth “product” environment users visit; it is an ephemeral validation sandbox.

## Consequences

### Positive

- Every PR gets consistent backend, frontend build, and UI smoke signal.
- Preview URL suitable for demos without explaining ports 5173/8000.
- Persistence path (Neon) is explicit without blocking CI.

### Negative / trade-offs

- Phase 1 does not remove manual local runs for “full stack” demos.
- Render free tier: service sleeps after idle; cold start latency on first request.
- Render free tier cold starts remain; Neon adds external DB dependency for preview.
- Docker + nginx add operational artifacts to maintain.

### Follow-up (not in ADR v1)

- Playwright E2E: login → notes CRUD against live API (see `deferred-work.md`).
- Post-deploy smoke (`GET /health`, `POST /auth/login`) in CD workflow.
- Auto-deploy on green `main` merge.
- CI Postgres migration smoke (Phase 2b); see `deferred-work.md`.
- Rate limiting on public preview; custom domain on Render.

## References

- Implementation phases and checklists: `_bmad-output/implementation-artifacts/plan-ci-cd-phases.md`
- ADR-003 (auth, proxy paths): `adr-003-stateless-jwt-authentication.md`
- Frontend production proxy rule: `_bmad-output/project-context.md`

## Implementation status

| Phase | Status |
|-------|--------|
| 1 — GitHub Actions CI | **Complete** — green on `main`; `actions/checkout@v6`, `setup-python@v6`, `setup-node@v5`, Node 24 for frontend |
| 2 — Render manual deploy (Docker + nginx) | **Complete** — https://bmad-python-fastapi.onrender.com/ |
| 3 — Neon Postgres on preview | **Complete** (2026-06-07) — `DATABASE_URL` on Render; production guard; persistence smoke passed; v0.4.5 |
