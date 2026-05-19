---
project_name: 'bmad-python-fastapi'
user_name: 'Vitali'
date: '2026-05-19'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
status: complete
rule_count: 42
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Python 3.11+ | Modern typing (`list[T]`, `T \| None`) |
| API | FastAPI 0.136.x | Sync endpoints; `TestClient` for tests |
| Server | Uvicorn 0.47.x | **Single worker** with file SQLite |
| Validation | Pydantic v2 | API schemas in `app/models.py` only |
| ORM | SQLAlchemy 2.0 sync | Declarative `Mapped` in `app/db_models.py` |
| Migrations | Alembic 1.18.x | Two-revision pattern (baseline + alter) |
| DB | SQLite | Default `sqlite:///./notes.db`; override via `DATABASE_URL` |
| Tests | pytest 8.x + httpx | In-memory DB via `dependency_overrides` |

`requirements.txt` uses version ranges; match installed `.venv` versions when pinning or documenting.

---

## Critical Implementation Rules

### Language-Specific Rules

- Use **Python 3.11+** syntax: `list[Note]`, `dict[str, str]`, `Note | None` (not `Optional` unless existing code uses it).
- Keep **Pydantic models** (`app/models.py`) separate from **SQLAlchemy rows** (`app/db_models.py`); map in `store._to_note()` only.
- Field length limits must stay aligned: `title` max 200, `body` max 10_000 in both Pydantic `Field` and SQLAlchemy `String(...)`.
- Partial updates: `NoteUpdate` fields default to `None` meaning “omit”; only apply non-`None` fields in `store.update_note`.
- Set `updated_at` with `datetime.now(UTC)` in `store.update_note` on successful update; leave `NULL` on create.
- Type-checking: `pyrightconfig.json` points at `.venv`; keep imports resolvable from project root.

### Framework-Specific Rules

- **Thin routers** (`app/routers/`): HTTP status, `Depends(get_db)`, `HTTPException`; no SQL in routers.
- **Repository** (`app/store.py`): all CRUD and `db.commit()` / `db.refresh()`; accept `Session` as first arg.
- Inject DB via `get_db()` generator in `app/database.py`; never instantiate `SessionLocal()` in routers.
- SQLite engines: always pass `connect_args={"check_same_thread": False}` when URL starts with `sqlite`.
- Routes: `APIRouter(prefix="/notes", tags=["notes"])`; list at `GET ""` (path `/notes`); 404 detail `"Note not found"`; DELETE returns `204` with empty body.
- Do **not** add `create_all` on app startup for schema evolution—use Alembic (`alembic upgrade head`).
- New schema changes: **new Alembic revision**; do not merge baseline + alter into one revision (see ADR-002).
- `alembic/env.py` must use `Base.metadata` from `app.db_models` and `DATABASE_URL` from `app.database`.

### Testing Rules

- API tests: use `tests/conftest.py` fixtures—`sqlite://` + `StaticPool`, `Base.metadata.create_all`/`drop_all` per test, override `app.dependency_overrides[get_db]`.
- Never read/write project-root `notes.db` in unit/API tests.
- Migration tests: separate file (`test_migrations.py`); temp file DB + `alembic.command.upgrade`; assert row preservation and nullable `updated_at` after upgrade.
- Assert `updated_at is None` after create, non-null after PUT update.
- Run tests: `python -m pytest` from project root.

### Code Quality & Style Rules

- Layout: `app/main.py` (app + health), `app/routers/`, `app/store.py`, `app/models.py`, `app/db_models.py`, `app/database.py`, `tests/test_*.py`, `alembic/versions/`.
- Naming: `snake_case` modules and functions; ORM class `NoteRow`, API model `Note`; private mapper `_to_note`.
- Minimal comments; code should be self-explanatory; update `README.md` when setup or migration flow changes.
- No production secrets in repo; no auth/CORS hardening unless explicitly requested.

### Development Workflow Rules

- Local setup: venv → `pip install -r requirements.txt` → `alembic upgrade head` → `uvicorn app.main:app --reload`.
- Brownfield DB (pre-Alembic `create_all`): `alembic stamp 001baseline` then `alembic upgrade head` (document in README if flow changes).
- Revision IDs in use: `001baseline` → `002updated_at` (check `alembic/versions/` for current chain).
- Out of scope unless user asks: auth, PostgreSQL swap, pagination, Docker, multi-worker SQLite deployment.
- Planning context: ADRs in `_bmad-output/planning-artifacts/adr/`; original learning spec in `_bmad-output/implementation-artifacts/` (may be stale vs current persistence).

### Critical Don't-Miss Rules

- **Do not** run multiple Uvicorn workers against one SQLite file (`database is locked`).
- **Do not** put business logic or raw SQL in routers; **do not** expose `NoteRow` in API responses.
- **Do not** add `updated_at` on create unless product explicitly requires it (nullable, no backfill per ADR-002).
- **Do not** use async SQLAlchemy/session without a project-wide migration to async endpoints and tests.
- **Do not** rely on `create_all` alone for team schema—always ship an Alembic revision for column/table changes.
- When adding columns: update `db_models.py`, Pydantic `Note` if exposed, `store` mapping, **and** a new migration; keep baseline/alter split for teaching migrations.
- `GET /health` must remain lightweight `{"status": "ok"}` for smoke checks.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new patterns emerge.

**For Humans:**

- Keep this file lean and focused on agent needs.
- Update when technology stack or ADRs change.
- Review quarterly for outdated rules.
- Remove rules that become obvious over time.

Last Updated: 2026-05-19
