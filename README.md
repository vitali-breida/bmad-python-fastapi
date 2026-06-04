# Notes API — FastAPI learning project

[![CI](https://github.com/vitali-breida/bmad-python-fastapi/actions/workflows/ci.yml/badge.svg)](https://github.com/vitali-breida/bmad-python-fastapi/actions/workflows/ci.yml)

Minimal CRUD API for notes with **SQLite** persistence and **JWT authentication** (ADR-003). Built to practice FastAPI basics: routes, Pydantic validation, dependency injection, SQLAlchemy, Alembic migrations, status codes, and tests.

**Breaking change (v0.4.0):** all `/notes` endpoints require `Authorization: Bearer <access_token>`. Obtain a token via `POST /auth/login` (see `.env.example` for bootstrap `admin` password after migrations).

## Prerequisites

- Python 3.11+

## Setup

```powershell
cd c:\Projects\bmad-python-fastapi
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
```

Copy `.env.example` to `.env` and set `SECRET_KEY` before using auth endpoints. The API loads `.env` from the project root on startup (`python-dotenv`). For migrations, set `INITIAL_ADMIN_PASSWORD` (bootstrap `admin` user) — Alembic does not load `.env` automatically; export the variable or run migrations from a shell that has it.

Optional: set `DATABASE_URL` (default `sqlite:///./notes.db`).

## Run the server

```powershell
python -m uvicorn app.main:app --reload
```

Use a **single worker** with the default SQLite file (see ADR in `_bmad-output/planning-artifacts/adr/`).

- API: http://127.0.0.1:8000
- Interactive docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

## Web UI (React)

The `frontend/` app is a Vite + React + TypeScript + Tailwind SPA. In development it proxies `/notes` and `/auth` to the API. Sign in stores the JWT in `sessionStorage` (see ADR-003 security notes on XSS).

**Server state** (notes list, create/update/delete) uses [**TanStack Query**](https://tanstack.com/query) (ADR-005): `useQuery` / `useMutation`, shared `queryKeys`, `invalidateQueries` after writes. **UI state** (form, selection, login gate, dialogs) stays in React `useState` in `App.tsx`. React Query DevTools load in dev only (`npm run dev`).

Layout: `frontend/src/api/` (fetch) → `hooks/useNotes.ts` → `query/` (`client.ts`, `keys.ts`, `errors.ts`). Plan: `_bmad-output/implementation-artifacts/plan-tanstack-query-phases.md`.

**Terminal 1 — API** (from project root, venv active):

```powershell
python -m uvicorn app.main:app --reload
```

**Terminal 2 — UI:**

```powershell
cd frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173 — create, edit, and delete notes in the browser.

### Frontend checks

From `frontend/`:

```powershell
npm run lint
npm run build
```

### Frontend E2E smoke test (Playwright)

Starts the Vite dev server automatically. The API does not need to be running for the smoke test (it only checks that the app shell loads).

```powershell
cd frontend
npm run test:e2e
```

CI-style run (retries, fresh dev server — same as GitHub Actions):

```powershell
cd frontend
$env:CI = "true"
npm run test:e2e
```

## Run locally with Docker

Uses the same image as [preview deploy](#preview-deploy-render): nginx serves the production Vite build and proxies `/notes`, `/auth`, `/health`, and `/docs` to Uvicorn inside the container. Good for checking **production-like** behavior; for day-to-day UI work with hot reload and Query DevTools, use [Web UI](#web-ui-react) (venv + `npm run dev`) instead.

**Prerequisites:** [Docker](https://www.docker.com/) (e.g. Docker Desktop on Windows).

From the project root (`.env` must exist — copy from `.env.example`; needs `SECRET_KEY` and `INITIAL_ADMIN_PASSWORD`):

```powershell
cd c:\Projects\bmad-python-fastapi

docker build -t notes-app:local .

docker run --rm -p 10000:10000 --env-file .env -v notes-sqlite:/app notes-app:local
```

- App: http://127.0.0.1:10000  
- Sign in: `admin` + password from `INITIAL_ADMIN_PASSWORD` in `.env`  
- Health: http://127.0.0.1:10000/health  

The named volume `notes-sqlite` keeps `notes.db` across container restarts. To map a host file instead: `-v ${PWD}/notes.db:/app/notes.db` (create an empty file first or let the entrypoint create the DB on first run).

To use another host port: `-p 8080:10000` → http://127.0.0.1:8080

## Try the API

All `/notes` calls require a Bearer token (v0.4.0). Log in first, then paste `access_token` from the JSON response:

```powershell
# 1) Obtain a token (use your bootstrap admin password from INITIAL_ADMIN_PASSWORD)
curl -X POST http://127.0.0.1:8000/auth/login -d "username=admin&password=change-me-local-only"

# 2) Replace <access_token> with the token from step 1
curl http://127.0.0.1:8000/notes -H "Authorization: Bearer <access_token>"
curl -X POST http://127.0.0.1:8000/notes -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" -d "{\"title\":\"My first note\",\"body\":\"Hello FastAPI\"}"
curl http://127.0.0.1:8000/notes/1 -H "Authorization: Bearer <access_token>"
```

Or use **Authorize** on `/docs` (username/password → token sent on **Try it out** for `/notes`).

Notes are stored in `notes.db` in the project root after migrations are applied.

## Database migrations

Schema is managed with [Alembic](https://alembic.sqlalchemy.org/). Apply all revisions:

```powershell
alembic upgrade head
```

Revision chain:

1. `001_baseline_notes` — `notes` table (`id`, `title`, `body`)
2. `002_add_notes_updated_at` — adds nullable `updated_at` (`DateTime(timezone=True)`)
3. `003_add_users_table` — `users` table + bootstrap `admin` (requires `INITIAL_ADMIN_PASSWORD` in the environment)

**Downgrade warning:** `alembic downgrade` past revision `003_add_users_table` **drops the `users` table** and removes bootstrap accounts. Back up `notes.db` before downgrading in environments that matter.

**Auth env (see `.env.example`):** `SECRET_KEY` (required for JWT; empty/whitespace = unset), `ACCESS_TOKEN_EXPIRE_MINUTES` (intended range 1–10080, default 60), `ENVIRONMENT` or `ENV` (`production` / `prod` triggers prod fail-fast for missing `SECRET_KEY`), `INITIAL_ADMIN_PASSWORD` (migration only; strip applied on upgrade).

### Brownfield: `notes.db` from before Alembic

If you already have a database created by the older `create_all` flow (ADR-001) with the baseline columns only:

```powershell
alembic stamp 001_baseline_notes
alembic upgrade head
```

`stamp` records the baseline revision without changing schema; `upgrade head` adds `updated_at`.

### Brownfield: old Alembic revision ids (`001baseline`, `002updated_at`)

If `alembic_version` still has the short ids from an earlier checkout, rename before upgrading:

```powershell
sqlite3 notes.db "UPDATE alembic_version SET version_num='001_baseline_notes' WHERE version_num='001baseline';"
sqlite3 notes.db "UPDATE alembic_version SET version_num='002_add_notes_updated_at' WHERE version_num='002updated_at';"
alembic upgrade head
```

### Fresh database

```powershell
$env:INITIAL_ADMIN_PASSWORD = "change-me-local-only"
alembic upgrade head
```

## Tests

```powershell
python -m pytest
```

Tests use an in-memory SQLite database via FastAPI dependency overrides (see `tests/conftest.py`). Migration behavior is covered in `tests/test_migrations.py`.

## Continuous integration

On every push and pull request to `main`, GitHub Actions runs three jobs (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

| Job | Checks |
|-----|--------|
| `backend` | `python -m pytest` (Python 3.11) |
| `frontend` | `npm run lint`, `npm run build` (Node 24) |
| `e2e` | Playwright smoke (`CI=true`; Vite dev server only) |

No repository secrets are required for CI.

## Preview deploy (Render)

**Live preview (ADR-004 v1):** https://bmad-python-fastapi.onrender.com/

Manual deploy to a single HTTPS origin. The Docker image serves the Vite build via nginx and proxies `/notes`, `/auth`, `/health`, and `/docs` to Uvicorn on the same host (same relative paths as local dev). Free tier may sleep after idle (cold start on first visit).

### Operator checklist

1. [Render](https://render.com) account → connect this GitHub repo.
2. **New Web Service** → **Docker** → branch `main` → enable **manual deploy** (recommended while learning the stack).
3. Environment variables (never commit values):

   | Variable | Purpose |
   |----------|---------|
   | `SECRET_KEY` | JWT signing (required in production) |
   | `INITIAL_ADMIN_PASSWORD` | Bootstrap `admin` on first `alembic upgrade head` |
   | `ENVIRONMENT` | `production` (container exits at startup if `SECRET_KEY` is missing) |
   | `DATABASE_URL` | Optional Phase 2: default SQLite in container; **Phase 3:** Neon Postgres URL |

4. In the Render service settings, set **Health Check Path** to `/health` (checks API via nginx, not only the static page).
5. Deploy manually; open the public URL and sign in as `admin`.

**Phase 2 limitation:** without Neon, SQLite lives on the container filesystem — notes may be **lost on redeploy** or instance replacement.

**Phase 3 (persistence, deferred):** when needed — [Neon](https://neon.tech) project → `DATABASE_URL` on Render → redeploy. `psycopg` is already in `requirements.txt`.

ADR-004 v1 is complete (CI + Render). Phase 3 and backlog: `_bmad-output/implementation-artifacts/deferred-work.md`. Plan: `_bmad-output/implementation-artifacts/plan-ci-cd-phases.md` · ADR: `_bmad-output/planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md`.

## Project layout

```
frontend/
  src/
    api/           # authFetch, notes API, ApiError
    hooks/         # useNotesQuery, note mutations (TanStack Query)
    query/         # QueryClient, keys, mapApiError
    components/
    App.tsx        # auth + UI state; wires hooks
  e2e/             # Playwright smoke tests
app/
  main.py          # FastAPI app
  models.py        # Pydantic API schemas
  db_models.py     # SQLAlchemy table models (NoteRow, UserRow)
  database.py      # Engine, session, get_db
  store.py         # Repository (notes CRUD)
  auth/            # JWT config, security, deps, user lookup
  routers/notes.py # CRUD /notes (Bearer required from v0.4.0)
  routers/auth.py  # POST /auth/login, GET /auth/me
alembic/
  env.py           # Binds to app.database + Base.metadata
  versions/        # Migration revisions
tests/
  conftest.py
  test_notes.py
  test_migrations.py
```

## Architecture notes

| Topic | Doc |
|-------|-----|
| JWT auth | `_bmad-output/planning-artifacts/adr/adr-003-stateless-jwt-authentication.md` |
| CI / Render preview | `_bmad-output/planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md` |
| TanStack Query (frontend server state) | `_bmad-output/planning-artifacts/adr/adr-005-frontend-tanstack-query-server-state.md` |

## Next learning steps

- API versioning or pagination on `GET /notes`
- PostgreSQL swap (same patterns, different `DATABASE_URL`)
- Deferred frontend: optimistic Query updates, full CRUD E2E with live API (see TanStack Query plan backlog)
