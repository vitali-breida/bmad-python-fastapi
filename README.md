# Notes API — FastAPI learning project

Minimal CRUD API for notes with **SQLite** persistence. Built to practice FastAPI basics: routes, Pydantic validation, dependency injection, SQLAlchemy, Alembic migrations, status codes, and tests.

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

Optional: set `DATABASE_URL` (default `sqlite:///./notes.db`).

## Run the server

```powershell
python -m uvicorn app.main:app --reload
```

Use a **single worker** with the default SQLite file (see ADR in `_bmad-output/planning-artifacts/adr/`).

- API: http://127.0.0.1:8000
- Interactive docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

## Try the API

```powershell
curl http://127.0.0.1:8000/notes
curl -X POST http://127.0.0.1:8000/notes -H "Content-Type: application/json" -d "{\"title\":\"My first note\",\"body\":\"Hello FastAPI\"}"
curl http://127.0.0.1:8000/notes/1
```

Or use the **Try it out** buttons on `/docs`.

Notes are stored in `notes.db` in the project root after migrations are applied.

## Database migrations

Schema is managed with [Alembic](https://alembic.sqlalchemy.org/). Apply all revisions:

```powershell
alembic upgrade head
```

Revision chain:

1. `001baseline` — `notes` table (`id`, `title`, `body`)
2. `002updated_at` — adds nullable `updated_at` (`DateTime(timezone=True)`)

### Brownfield: `notes.db` from before Alembic

If you already have a database created by the older `create_all` flow (ADR-001) with the baseline columns only:

```powershell
alembic stamp 001baseline
alembic upgrade head
```

`stamp` records the baseline revision without changing schema; `upgrade head` adds `updated_at`.

### Fresh database

```powershell
alembic upgrade head
```

## Tests

```powershell
python -m pytest
```

Tests use an in-memory SQLite database via FastAPI dependency overrides (see `tests/conftest.py`). Migration behavior is covered in `tests/test_migrations.py`.

## Project layout

```
app/
  main.py          # FastAPI app
  models.py        # Pydantic API schemas
  db_models.py     # SQLAlchemy table models
  database.py      # Engine, session, get_db
  store.py         # Repository (CRUD)
  routers/notes.py # CRUD /notes
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
