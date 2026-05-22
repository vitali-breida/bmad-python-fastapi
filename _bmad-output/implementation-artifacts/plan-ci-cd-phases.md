# CI/CD implementation plan (phased)

**ADR:** `../planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md`  
**Status:** **v1 complete** (Phases 1–2 accepted; Phase 3 deferred)  
**Preview URL:** https://bmad-python-fastapi.onrender.com/  
**Phase 1:** CI green on `main` ✓  
**Phase 2:** Render manual deploy ✓  
**Phase 3:** deferred — Neon `DATABASE_URL` not configured on Render  
**Last updated:** 2026-05-22

## Summary

| Phase | Goal | User-visible outcome |
|-------|------|----------------------|
| **1** | CI | Green/red checks on GitHub for PRs and `main` |
| **2** | CD (manual) | `https://<app>.onrender.com` — one URL, HTTPS |
| **3** | Persistence | Demo notes survive Render redeploys |

---

## Plan verification

**Last verified:** 2026-05-22 (post-deploy: CI green, Render preview live, local Docker smoke OK)  
**Verdict:** ADR-004 v1 **done**. Phase 3 and backlog tracked in `deferred-work.md`.

### ADR ↔ plan

| Check | Result |
|-------|--------|
| Phases, triggers, jobs, secrets, one-origin proxy | Pass |
| Deferred backlog ↔ `deferred-work.md` | Pass |
| `project-context.md` / README pointers to ADR-004 | Pass |

### Phase 1 — preflight (repo commands, workflow not added)

| Command | Result | Notes |
|---------|--------|--------|
| `python -m pytest` | Pass | 28 tests; in-memory DB via `conftest.py` |
| `cd frontend && npm run lint` | Pass | Was blocked by `react-hooks/set-state-in-effect` on `setLoading(false)` in `useEffect`; fixed by initializing `loading` from `getAccessToken()` and dropping the guest branch `setState` in the effect |
| `cd frontend && npm run build` | Pass | `tsc` + Vite |
| `cd frontend && CI=true npm run test:e2e` | Not re-run locally | Port `5173` already in use on dev machine; `playwright.config.ts` uses `reuseExistingServer: !process.env.CI` — expect pass on a clean GitHub runner |

### Phase 1 — implementation artifacts

| Artifact | Status |
|----------|--------|
| `.github/workflows/ci.yml` | Present |
| README CI section / badge | Present |
| `Dockerfile`, `deploy/nginx.conf.template`, `deploy/entrypoint.sh` | Present (Phase 2) |
| `psycopg[binary]` in `requirements.txt` | Present (Phase 3) |

### Phases 2–3 — design review (no deploy artifacts)

| Topic | Status | Note for implementers |
|-------|--------|------------------------|
| nginx + static + `/notes`, `/auth` proxy | Design OK | Matches Vite dev proxy and relative API paths |
| Render `PORT` | Done | `entrypoint.sh` + `envsubst` on `nginx.conf.template` |
| `/health`, `/docs` on preview host | Done | Regex `location` in `deploy/nginx.conf.template`; Render health check `/health` |
| `INITIAL_ADMIN_PASSWORD` on first deploy | Required | Alembic `003` fails without env (Alembic does not load `.env`) |
| Neon / `psycopg` | Deferred | Correct per Phase 3 |

---

## Phase 1 — GitHub Actions CI

### Scope

- Add `.github/workflows/ci.yml` (name e.g. `CI`).
- Triggers: `push` and `pull_request` to `main`.
- No Render, Neon, or repository secrets required for production (pytest already sets test `SECRET_KEY` via `conftest.py`).

### Jobs

| Job | Working directory | Steps |
|-----|-------------------|--------|
| `backend` | repo root | Python 3.11, `pip install -r requirements.txt`, `python -m pytest` |
| `frontend` | `frontend/` | Node 24, `npm ci`, `npm run lint`, `npm run build` |
| `e2e` | `frontend/` | `npm ci`, `npx playwright install --with-deps chromium`, `npm run test:e2e` with `CI=true` |

Jobs may run in parallel. E2E uses Playwright `webServer` (`npm run dev` on `127.0.0.1:5173`); API does not need to run.

### Acceptance criteria

- [x] Workflow runs on push/PR to `main`.
- [x] All three jobs pass on `main`.
- [x] README section documents CI (badge + workflow link).

### Out of scope (Phase 1)

- Deploy, Docker, nginx, Neon, `psycopg`.
- Full auth + notes E2E against API.
- `pip audit`, Ruff, mypy (unless added by separate decision).

---

## Phase 2 — Manual preview on Render

### Scope

- `Dockerfile` multi-stage or single image: build `frontend/dist`, run Uvicorn, nginx on port 80 (or Render `PORT`).
- `deploy/nginx.conf` (or similar): serve static; `proxy_pass` for `/notes` and `/auth` to Uvicorn.
- Render Web Service: deploy from GitHub repo; **manual deploy** enabled.
- Environment on Render: `SECRET_KEY`, `INITIAL_ADMIN_PASSWORD`, `ENVIRONMENT=production`.
- Startup: `alembic upgrade head` then nginx + uvicorn (entrypoint script).

### Architecture (one origin)

```
Browser → https://<service>.onrender.com
            ├── /          → static (Vite build)
            ├── /notes/*   → proxy → uvicorn
            └── /auth/*    → proxy → uvicorn
```

### Acceptance criteria

- [x] Preview URL shows login shell over HTTPS — https://bmad-python-fastapi.onrender.com/
- [x] Login as bootstrap `admin` works; CRUD notes works in session.
- [x] `/docs` and `/health` reachable on same host (nginx proxy).

### Known limitation until Phase 3

- Default `DATABASE_URL` SQLite inside container: data may be **lost on redeploy** or instance replacement. Acceptable short-term per ADR-004; document in README preview section.

### Operator checklist (Render)

1. Create Render account; connect GitHub repo.
2. New **Web Service** → Docker; select branch (e.g. `main`).
3. Set environment variables (secrets); do not commit values.
4. First deploy manual; copy public URL (`https://…onrender.com`).
5. Re-deploy manually after changes when ready.

---

## Phase 3 — Neon Postgres (persistence) — **deferred**

Not scheduled for v1. Code prep (`psycopg`, `DATABASE_URL` normalization) is in repo; operator steps remain in README when needed.

### Scope

- Create Neon project; copy `postgresql://…` connection string.
- Add Postgres driver to `requirements.txt` (e.g. `psycopg[binary]`).
- Verify Alembic revisions on Postgres (especially `003_add_users_table` bootstrap).
- Set `DATABASE_URL` on Render; remove reliance on container-local SQLite for preview.
- Document SSL/`sslmode` if required by Neon connection string.

### Acceptance criteria

- [ ] Create note on preview; trigger manual redeploy; note still present.
- [ ] Migration `upgrade head` succeeds against Neon on deploy.

### Out of scope unless requested

- Postgres for local dev (can remain SQLite).
- Connection pooling / multi-worker (stay single worker per ADR-001 SQLite guidance; revisit for Postgres if scaling preview).

---

## Deferred (backlog)

Tracked in `deferred-work.md` where overlapping:

| Item | Notes |
|------|--------|
| Playwright login → notes CRUD with live API | Stronger demo guarantee; run API in CI or against preview |
| Post-deploy smoke in workflow | `curl /health`, login after Render deploy |
| Auto-deploy on `main` | Revisit after manual CD is stable |
| Rate limiting on preview | ADR-003 optional follow-up |
| Custom domain + DNS | Optional on Render |

---

## Documentation touchpoints (v1 — done)

| File | Status |
|------|--------|
| `README.md` | CI badge/section; preview deploy + live URL |
| `.env.example` | Neon `DATABASE_URL` comment |
| `_bmad-output/project-context.md` | ADR-004 + preview URL |
| `deferred-work.md` | Phase 3 + backlog |
| `adr-004-ci-cd-and-preview-deployment.md` | Implementation status |

---

## Decision log (workshop 2026-05-22)

| Question | Decision |
|----------|----------|
| CI only vs CI+CD first? | CI first (Phase 1) |
| Hosting | Render |
| Postgres timing | After CI; Neon in Phase 3 |
| Pipeline depth | Baseline (pytest, lint, build, Playwright smoke) |
| Deploy trigger | Manual |
| URL model | Single HTTPS origin |
| Budget / repo | Free tier; public GitHub |
