# Notes API — FastAPI learning project

Minimal CRUD API for notes with **SQLite** persistence. Built to practice FastAPI basics: routes, Pydantic validation, dependency injection, SQLAlchemy, status codes, and tests.

## Prerequisites

- Python 3.11+

## Setup

```powershell
cd c:\Projects\bmad-python-fastapi
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
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

Notes are stored in `notes.db` in the project root (created on first request).

## Tests

```powershell
python -m pytest
```

Tests use an in-memory SQLite database via FastAPI dependency overrides (see `tests/conftest.py`).

## Project layout

```
app/
  main.py          # FastAPI app + lifespan (create tables)
  models.py        # Pydantic API schemas
  db_models.py     # SQLAlchemy table models
  database.py      # Engine, session, get_db
  store.py         # Repository (CRUD)
  routers/notes.py # CRUD /notes
tests/
  conftest.py
  test_notes.py
```

## Next learning steps

- Alembic migrations
- API versioning or pagination on `GET /notes`
- PostgreSQL swap (same patterns, different `DATABASE_URL`)
