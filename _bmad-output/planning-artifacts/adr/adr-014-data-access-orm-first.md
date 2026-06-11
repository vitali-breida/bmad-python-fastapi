# ADR-014: Data access — ORM first, raw SQL by exception

**Status:** Accepted  
**Date:** 2026-06-11  
**Scope:** Backend data-access style for SQLAlchemy repositories. Applies to `app/store.py`, `app/auth/users.py`, and any future repository modules.  
**Related:** ADR-001 (SQLAlchemy ORM + repository pattern), ADR-003 (`users.py` vs `store.py` split), `project-context.md`.  
**Discussion:** Party-mode roundtable (2026-06-11) — ORM vs plain SQL for current 2-table CRUD stack and planned growth (`owner_id`, authz).

## Context

SQLAlchemy supports multiple access styles: declarative ORM (`select(Model)`, `db.get()`), Core (`insert()`, `update()`), and plain SQL (`text()`). The project already uses **SQLAlchemy 2.0 sync ORM** with a **repository layer** and separate Pydantic API models.

Current scale: two tables (`notes`, `users`), simple CRUD, Alembic migrations, SQLite locally and Neon Postgres in preview/production. No raw SQL in the codebase today.

The team needs a **default rule** so agents and contributors do not debate ORM vs SQL on every change, while leaving room for justified exceptions (complex queries, bulk ops, DB-specific features).

## Decision

| Rule | Policy |
|------|--------|
| **Default** | Use **SQLAlchemy ORM** in repository modules — `select()`, `db.get()`, `db.add()` / `commit()` / `refresh()` against `Mapped` models in `app/db_models.py`. |
| **Repository boundary** | All DB access lives in `app/store.py` (notes) or `app/auth/users.py` (users) — **not** in routers. |
| **Exception** | `text()`, Core, or other non-ORM SQL **only** when ORM is genuinely awkward (e.g. complex aggregations, bulk operations, window functions, Postgres-specific SQL). |
| **Exception documentation** | Every non-ORM query **must** include an inline comment stating **why** — typically **performance** or **query expressiveness**. One sentence is enough. |
| **Routers** | **Never** raw SQL or ORM calls in `app/routers/`. |

### Examples

**Default (ORM) — no extra comment required:**

```python
rows = db.scalars(select(NoteRow).order_by(NoteRow.id)).all()
```

**Exception — comment required:**

```python
# raw SQL: window function for ranked notes per user — awkward in ORM at this scale
result = db.execute(text("SELECT ... ROW_NUMBER() OVER (...)"), params)
```

## Rationale

- **Matches current code** — `store.py` and `auth/users.py` already follow this pattern; no migration needed.
- **Velocity at current scale** — CRUD on two entities does not benefit from hand-written SQL; ORM + Alembic keep schema and models aligned.
- **Safety for future authz** — filtering (e.g. `owner_id`) in one repository module reduces risk of a forgotten `WHERE` in a scattered raw-SQL string.
- **Escape hatch without paradigm shift** — raw SQL remains available as a **surgical tool**, not a second standard.

## Consequences

**Positive**

- Clear default for AI agents and reviewers.
- Consistent with ADR-001 repository pattern and thin routers.
- Postgres migration stays manageable — most queries remain dialect-agnostic via ORM.

**Negative / constraints**

- Complex reporting may still need Core/SQL — must follow the comment rule.
- ORM misuse (N+1, lazy loading in API) is a separate discipline; this ADR does not mandate eager loading.

## Out of scope

- Switching to async SQLAlchemy (see `project-context.md` — project-wide migration required).
- Replacing SQLAlchemy with another stack.
- Mandating raw SQL for “serious” systems — rejected; hybrid is intentional.

## Implementation notes

- No code change required for acceptance; existing repositories already comply.
- New repository methods: ORM unless the exception criteria apply.
- Code review / `bmad-code-review`: flag raw SQL without a `why` comment.

## References

- [ADR-001](adr-001-sqlite-notes-persistence.md) — original ORM + repository decision
- [SQLAlchemy 2.0 — ORM Querying](https://docs.sqlalchemy.org/en/20/orm/queryguide/index.html)
- `app/store.py`, `app/auth/users.py`, `_bmad-output/project-context.md`
