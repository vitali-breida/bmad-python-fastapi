# ADR-002: Alembic migrations and `updated_at` on notes

**Status:** Accepted  
**Date:** 2026-05-18  
**Context:** ADR-001 delivered SQLite persistence with `Base.metadata.create_all()` on startup. Schema changes are not versioned; the learning trajectory calls for Alembic. Party-mode agreement (architect + PM + dev alignment): introduce migrations with a real schema change—not an empty init only—so the upgrade/downgrade cycle is visible immediately.

**Supersedes (partially):** ADR-001 row “Migrations: Deferred” — migrations are now in scope; `create_all` is no longer the sole schema mechanism for local/dev.

## Decision


| Area                          | Choice                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tooling                       | [Alembic](https://alembic.sqlalchemy.org/) against the existing SQLAlchemy 2.0 sync engine                                                                                |
| Migration strategy            | **Two revisions**, not one combined step: (1) **baseline** reflecting current `notes` (`id`, `title`, `body`); (2) **alter** adding `updated_at`                          |
| New column                    | `updated_at` — `DateTime(timezone=True)`, **nullable**, no backfill for existing rows (`NULL` until first update)                                                         |
| Application behavior          | Set `updated_at` to UTC “now” on successful `update_note` (PATCH/PUT path); leave `NULL` on create unless explicitly set later                                            |
| API contract                  | Expose `updated_at` on `Note` response (`datetime | null`); optional on create/update payloads (read-only from client)                                                    |
| Dev / deploy schema           | Run `alembic upgrade head` before or instead of relying on `create_all` for schema; document in README                                                                    |
| Existing DBs                  | Baseline revision + `alembic stamp` (or documented stamp path) for DBs already created by ADR-001 `create_all`, then apply alter revision                                 |
| Tests                         | Dedicated migration test: seed rows pre-alter → `upgrade` to head → assert row count unchanged, `updated_at IS NULL`; optional test that PATCH sets non-null `updated_at` |
| Out of scope (this increment) | Pagination, PostgreSQL swap, auth, `is_pinned` / other columns, Alembic autogenerate CI, multi-worker SQLite                                                              |


## Rationale

- **Baseline + alter** separates “Alembic is wired” from “schema evolved,” matching how real projects ship migrations and avoiding a single opaque revision.
- `**updated_at`** is a common production pattern (audit/sort) and teaches nullable columns, app-side vs DB defaults, and PATCH side effects—without the extra domain semantics of `is_pinned` on the first migration.
- **Nullable, no backfill** keeps the alter migration simple and makes pre-migration rows observable in tests.
- Stays on **sync SQLite** per ADR-001; no new infrastructure.

## Consequences

**Positive**

- Schema changes are repeatable and reviewable (`alembic/versions/`).
- Completes the persistence learning arc started in ADR-001.
- Clear template for future columns (e.g. pagination indexes, `archived`) via further revisions.

**Negative / constraints**

- Developers must run migrations locally; drift if someone only uses `create_all`.
- Existing `notes.db` files need a one-time stamp/upgrade path documented in README.
- ADR-001 constraints still apply: single Uvicorn worker on file-backed SQLite.

## Implementation notes

### Revision sequence

1. `*_baseline_notes.py` — `CREATE TABLE notes` with `id`, `title`, `body` (match `app/db_models.py` today).
2. `*_add_notes_updated_at.py` — `op.add_column("notes", sa.Column("updated_at", DateTime(timezone=True), nullable=True))`.

Do not merge baseline and alter into one revision.

### Code touchpoints (expected)

- `alembic.ini`, `alembic/env.py` — bind to `app.database` engine URL and `Base.metadata`
- `app/db_models.py` — add `updated_at` on `NoteRow`
- `app/models.py` — add `updated_at: datetime | None` on `Note`
- `app/store.py` — set `updated_at` in `update_note`; map in `_to_note`
- `app/main.py` / `app/database.py` — replace or gate `init_db()` / `create_all` in favor of documented migration flow
- `tests/test_migrations.py` (or equivalent) — programmatic `command.upgrade`
- `README.md` — `alembic upgrade head`, stamp note for brownfield DBs
- `requirements.txt` — pin `alembic`

### Brownfield (`notes.db` already exists)

1. Generate baseline revision from current models.
2. `alembic stamp <baseline_rev>` on existing DB (no-op schema).
3. `alembic upgrade head` to apply `updated_at` alter.

Fresh DB: `alembic upgrade head` only.

### Party-mode decisions *not* taken

- `**is_pinned`** — deferred; simpler first migration was rejected in favor of `updated_at` (Winston).
- **Pagination** — next API increment after migrations land (Amelia).
- **Filter `?pinned=`** — not in this increment.

## References

- [ADR-001: SQLite persistence for Notes API](./adr-001-sqlite-notes-persistence.md)
- [Alembic — Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [Alembic — Autogenerate](https://alembic.sqlalchemy.org/en/latest/autogenerate.html)
- Project README — “Next learning steps” (Alembic)

