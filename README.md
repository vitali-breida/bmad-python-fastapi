# Notes API — FastAPI learning project

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

### Frontend E2E smoke test (Playwright)

Starts the Vite dev server automatically. The API does not need to be running for the smoke test (it only checks that the app shell loads).

```powershell
cd frontend
npm run test:e2e
```

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

## Project layout

```
frontend/
  src/             # React UI (Vite, TypeScript, Tailwind)
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

## Next learning steps

- API versioning or pagination on `GET /notes`
- PostgreSQL swap (same patterns, different `DATABASE_URL`)
