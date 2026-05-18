# Notes API — FastAPI learning project

Minimal CRUD API for notes (in-memory). Built to practice FastAPI basics: routes, Pydantic validation, status codes, and tests.

## Prerequisites

- Python 3.11+

## Setup

```powershell
cd c:\Projects\bmad-python-fastapi
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run the server

```powershell
python -m uvicorn app.main:app --reload
```

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

## Tests

```powershell
python -m pytest
```

## Project layout

```
app/
  main.py          # FastAPI app + /health
  models.py        # Pydantic schemas
  store.py         # In-memory storage
  routers/notes.py # CRUD /notes
tests/
  test_notes.py
```

## Next learning steps

- Add SQLite persistence (one story in BMad sprint)
- Dependency injection for `store`
- API versioning or pagination on `GET /notes`
