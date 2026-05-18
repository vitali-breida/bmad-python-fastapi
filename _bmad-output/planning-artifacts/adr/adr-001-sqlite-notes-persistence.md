# ADR-001: SQLite persistence for Notes API

**Status:** Accepted  
**Date:** 2026-05-18  
**Context:** Replace in-memory `app/store.py` with durable storage while keeping the project a focused FastAPI learning exercise.

## Decision

| Area | Choice |
|------|--------|
| Database | SQLite (file `notes.db`, overridable via `DATABASE_URL`) |
| ORM | SQLAlchemy 2.0 (sync), declarative `Mapped` models |
| API models | Keep existing Pydantic schemas in `app/models.py` |
| Data access | `app/store.py` as repository; session passed per call |
| Wiring | `get_db()` + `Depends` in routers |
| Schema setup | `Base.metadata.create_all()` on app startup |
| Migrations | Deferred (no Alembic in this increment) |
| Async / SQLModel / PostgreSQL | Out of scope for now |

## Rationale

- SQLite needs no extra infrastructure; matches README “next step” and learning goals.
- Sync stack fits current sync endpoints and `TestClient` without `pytest-asyncio`.
- Separate ORM and Pydantic types preserve a clear HTTP vs persistence boundary.
- Dependency injection matches FastAPI conventions and simplifies test overrides.

## Consequences

**Positive**

- Notes survive process restarts.
- Tests use in-memory SQLite with `dependency_overrides` (no `reset_store()`).
- Clear path to PostgreSQL later (swap `DATABASE_URL` + driver).

**Negative / constraints**

- Do not run multiple Uvicorn workers against one SQLite file (`database is locked`).
- Not suitable for high concurrent write load; document single-worker deployment.
- `create_all` does not evolve schema; Alembic needed before production schema changes.

## Implementation notes

- Default URL: `sqlite:///./notes.db`
- SQLite engines use `connect_args={"check_same_thread": False}` when required.
- Tests: `sqlite://` + `StaticPool`, override `get_db`, rollback or isolated DB per test module.

## References

- [FastAPI — Testing a Database](https://fastapi.tiangolo.com/advanced/testing-database/)
- Project README learning trajectory
