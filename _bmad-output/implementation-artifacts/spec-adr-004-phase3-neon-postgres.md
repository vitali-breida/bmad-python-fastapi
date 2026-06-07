---
title: 'ADR-004 Phase 3 — Neon Postgres on Preview'
type: 'implementation'
created: '2026-06-07'
status: 'done'
context:
  - '{project-root}/_bmad-output/planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md'
  - '{project-root}/_bmad-output/implementation-artifacts/plan-ci-cd-phases.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/quality-gates.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Preview on Render (ADR-004 Phase 2) uses SQLite inside the container filesystem. Notes and users do **not** survive manual redeploy or instance replacement. ADR-004 Phase 3 (Neon managed PostgreSQL) was deferred; code prep (`psycopg`, `DATABASE_URL` normalization in `app/database.py`) is already in the repo.

**Approach:** Activate Phase 3 without a new ADR. Keep **local dev on SQLite** (ADR-001, ADR-004). Point preview `DATABASE_URL` at Neon Postgres. Add a **production fail-fast guard** so a missing or SQLite `DATABASE_URL` cannot silently run in production. Verify Alembic `001`–`003` on Postgres. Document operator steps; close deferred item in `deferred-work.md` and update ADR-004 status on sign-off.

## Boundaries & Constraints

**Always:** Single codebase — no `if postgres` branches in routers/store/auth business logic. Only dialect-specific code in `app/database.py` (`connect_args` for SQLite) and production validation. Local default remains `sqlite:///./notes.db`. Preview runs `alembic upgrade head` via `deploy/entrypoint.sh` before Uvicorn. Single Uvicorn worker on preview (multi-worker deferred). Tests continue using in-memory SQLite overrides — no Neon in CI required for v1 sign-off.

**Ask First:** Postgres for local dev as team default; multi-worker Uvicorn on preview; async SQLAlchemy; CI job with Postgres service container (optional Phase 2b); changing Alembic revision SQL to be Postgres-only without SQLite compatibility.

**Never:** Commit Neon credentials or `DATABASE_URL` to git; remove SQLite local path; add CORS or split-origin API; scope creep into authz/RBAC or note `owner_id`.

**Deferred (this epic):** CI job running pytest against Postgres service container; Postgres via docker-compose for local parity; connection pooling; multi-worker scaling; post-deploy smoke workflow in GitHub Actions.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Local dev, no `DATABASE_URL` | Default env | SQLite `notes.db`; app starts | N/A |
| Local dev, explicit SQLite URL | `DATABASE_URL=sqlite:///./notes.db` | Same as default | N/A |
| Preview prod, Neon URL set | `ENVIRONMENT=production`, `DATABASE_URL=postgresql://…?sslmode=require` | Normalized to `postgresql+psycopg://…`; migrations run; notes persist across redeploy | Connection errors surface at startup/migration |
| Preview prod, `DATABASE_URL` unset | `ENVIRONMENT=production`, no `DATABASE_URL` | Container **fails at startup** before serving traffic | Clear `RuntimeError` message |
| Preview prod, SQLite URL | `ENVIRONMENT=production`, `DATABASE_URL=sqlite:///…` | Container **fails at startup** | Clear `RuntimeError` message |
| Non-prod, SQLite URL | Dev/CI/test | No database guard failure | Existing behavior |
| Alembic on Neon | Clean Postgres, `upgrade head` | Revisions `001`–`003` apply; admin seed idempotent | Migration failure blocks deploy (entrypoint `set -e`) |
| Redeploy persistence | Note created on preview; manual redeploy | Same note still listed after login | Manual smoke AC |
| JWT / auth | Unchanged | Login and protected `/notes` work on Postgres | Same 401 semantics as SQLite |

</frozen-after-approval>

## Code Map

| Area | Files |
|------|-------|
| DB URL + engine | `app/database.py` — add `validate_production_database_url()` (or equivalent) |
| Prod startup gate | `app/auth/config.py` — extend `validate_production_config()` **or** call database validator from same entrypoint hook |
| Container startup | `deploy/entrypoint.sh` — ensure validator runs after `alembic upgrade head` (already calls `validate_production_config`) |
| Tests | `tests/test_database.py` (new) — production guard cases; optionally extend `tests/test_migrations.py` |
| Docs | `README.md` (Preview Phase 3), `.env.example`, `_bmad-output/project-context.md` |
| Traceability | `_bmad-output/planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md`, `_bmad-output/implementation-artifacts/deferred-work.md` |

**Already in place (no change required unless verification fails):**

- `psycopg[binary]` in `requirements.txt`
- `_normalize_database_url()` in `app/database.py`
- `.env.example` Neon `DATABASE_URL` comment with `sslmode=require`
- `alembic/env.py` reads `DATABASE_URL` from `app.database`

## Tasks & Acceptance

### Phase 1 — Production database fail-fast guard

- [x] `app/database.py` — add function that raises if `_is_production()` and (`DATABASE_URL` unset **or** URL starts with `sqlite`)
- [x] Wire guard into startup path used by preview container (`validate_production_config()` in `app/auth/config.py` **or** second call from `deploy/entrypoint.sh`)
- [x] Error message names the fix: set Neon `DATABASE_URL` on Render; do not use SQLite in production

**Phase 1 acceptance:**

- Given `ENVIRONMENT=production` and no `DATABASE_URL`, when startup validation runs, then `RuntimeError` is raised before Uvicorn binds.
- Given `ENVIRONMENT=production` and `DATABASE_URL=sqlite:///./notes.db`, when startup validation runs, then `RuntimeError` is raised.
- Given `ENVIRONMENT=production` and `DATABASE_URL=postgresql://user:pass@host/db`, when startup validation runs, then no error from database guard.
- Given default dev env (no production flag), when app imports `app.database`, then SQLite default works unchanged.

### Phase 2 — Tests

- [x] `tests/test_database.py` — cover Phase 1 guard matrix (use `monkeypatch` for env vars; do not require real Postgres)
- [x] Confirm existing `tests/test_migrations.py` still passes on SQLite (regression)

**Phase 2 acceptance:**

- Given project root with venv, when `python -m pytest tests/test_database.py -q`, then all new tests pass.
- Given full suite, when `python -m pytest --cov=app --cov-fail-under=85`, then ≥85% coverage and all tests green.

**Phase 2b — Postgres migration verify (optional; defer if blocked)**

- [x] Document one-time manual check: `DATABASE_URL=postgresql://… alembic upgrade head` on clean Neon DB — verified on Neon via Render deploy 2026-06-07
- [ ] **Or** add CI job with `postgres:16` service + migration smoke (deferred → `deferred-work.md`)

**Phase 2b acceptance (if implemented):**

- Given clean Postgres instance, when `alembic upgrade head`, then schema matches SQLite path and admin seed from `003` exists.

### Phase 3 — Documentation

- [x] `README.md` — Phase 3 operator steps: Neon project → connection string → Render env → redeploy → persistence smoke; note `sslmode=require`
- [x] `_bmad-output/project-context.md` — preview DB row: Neon Postgres (Phase 3); production guard rule; local stays SQLite
- [x] `.env.example` — confirm Neon example remains accurate (update only if needed)

**Phase 3 acceptance:**

- Given a new operator, when they follow README Phase 3 section only, then they can configure Render without reading ADR files.

### Phase 4 — Operator: Neon + Render (manual)

- [x] Create Neon project; copy `postgresql://…` connection string (include `sslmode=require` if not in URL)
- [x] Render dashboard: set `DATABASE_URL`; keep `SECRET_KEY`, `INITIAL_ADMIN_PASSWORD`, `ENVIRONMENT=production`
- [x] Manual deploy; confirm container starts (guard + migrations succeed)
- [x] **Persistence smoke:** create note → manual redeploy → note still present after login

**Phase 4 acceptance:**

- Given preview URL after Phase 3 deploy, when user creates a note and operator triggers redeploy, then note is still visible on next login.
- Given Render logs on startup, when deploy succeeds, then `alembic upgrade head` completed without error.

### Phase 5 — Close traceability

- [x] `_bmad-output/planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md` — Phase 3 row → **Complete**
- [x] `_bmad-output/implementation-artifacts/deferred-work.md` — remove or strike Neon Postgres deferred item; add any new deferrals (e.g. Phase 2b CI Postgres)
- [x] `_bmad-output/implementation-artifacts/plan-ci-cd-phases.md` — Phase 3 status → complete

**Phase 5 acceptance:**

- Given epic sign-off, when docs are read, then no contradictory “Phase 3 deferred” statements remain except explicitly listed new deferrals.

## Coverage baseline (epic start)

- Backend coverage: **92%** (`python -m pytest --cov=app -q`)
- pytest count: **28**
- e2e count: **15**
- Critical paths: **7/7**

## Test delta (plan)

| Type | Min new |
|------|---------|
| pytest | **+2** (production database guard matrix) |
| e2e | **0** (infra-only; no user-visible behavior change) |

_Epic type: backend infra guard — extends ADR-004 Phase 3; not a UX epic._

## Test delta (actual — epic sign-off)

| Type | Before | After | Delta | Plan met? |
|------|--------|-------|-------|-----------|
| pytest | 28 | 35 | +7 | [x] |
| e2e | 15 | 15 | 0 | [x] |

**Coverage after:** 94% (Δ +2% vs baseline)

## Design Notes

**Guard placement:** Prefer extending `validate_production_config()` to call a database validator from `app/database.py`, keeping one startup hook in `entrypoint.sh`. Avoid duplicating `_is_production()` — import shared helper from `app/auth/config.py` or extract to tiny shared module only if import cycle appears.

**Why fail-fast:** Silent fallback to container SQLite “works” until redeploy wipes data — worst failure mode for preview demos.

**Local vs preview:** Developers never set `ENVIRONMENT=production` locally; guard is inactive. CI/e2e use SQLite file or in-memory URLs without production flag.

**No VERSION bump** unless user-visible release notes desired; persistence fix is operator-facing preview reliability, not product semver feature.

## Verification

**Commands:**

```bash
python -m pytest tests/test_database.py -q
python -m pytest --cov=app --cov-fail-under=85 --cov-report=term-missing
cd frontend && npm run lint
cd frontend && npm run build
cd frontend && npm run test:e2e
```

**Manual checks (Phase 4 — record date at sign-off):**

1. Preview: login as `admin` → create note with distinctive title
2. Render: manual redeploy
3. Preview: login again → note still listed
4. Render logs: no migration errors on startup

## Quality Gates

See canonical checklist: `_bmad-output/implementation-artifacts/quality-gates.md`

- [x] UX/spec scope documented (explicit in / out of scope)
- [x] All phase acceptance criteria marked complete in this spec
- [x] `bmad-code-review` complete — 0 open Patch items (Defer → `deferred-work.md`)
- [x] `python -m pytest --cov=app --cov-fail-under=85 --cov-report=term-missing` — pass (from project root)
- [x] `cd frontend && npm run lint` — pass
- [x] `cd frontend && npm run build` — pass
- [x] `cd frontend && npm run test:e2e` — pass (API on :8000)
- [x] Manual smoke from spec Verification section — pass (record date below)
- [x] `project-context.md` updated if patterns changed
- [x] `CHANGELOG.md` + `VERSION` bumped if user-visible release — v0.4.5
- [x] New deferrals added to `deferred-work.md` with reason
- [x] Coverage policy sign-off (Rules 1–4) — see Coverage sign-off below

**Manual smoke date:** 2026-06-07  
**Reviewer / sign-off:** Vitali (operator persistence smoke)  
**Coverage after:** 94% (Δ +2% vs baseline)

## Coverage sign-off

- [x] Rule 1: CI backend job green (≥85%)
- [x] Rule 2: CI e2e job green (7/7 critical paths)
- [x] Rule 3: Test delta (actual) ≥ plan
- [x] Rule 4: coverage delta ≥ −2% or deferred in `deferred-work.md`

## Suggested Review Order

**Production guard**

- Database URL validation
  [`app/database.py`](../../app/database.py)
- Startup validation hook
  [`app/auth/config.py`](../../app/auth/config.py), [`deploy/entrypoint.sh`](../../deploy/entrypoint.sh)

**Tests**

- Guard matrix
  [`tests/test_database.py`](../../tests/test_database.py) _(new)_

**Traceability**

- ADR-004 Phase 3 decision
  [`adr-004-ci-cd-and-preview-deployment.md`](../planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md)
- Phased checklist
  [`plan-ci-cd-phases.md`](plan-ci-cd-phases.md)

## Dev Agent Record

### Implementation Plan

- Added `validate_production_database_url()` in `app/database.py`; wired via lazy import in `validate_production_config()`.
- Guard checks raw `DATABASE_URL` env (not module default) when `ENVIRONMENT=production`.
- Five pytest cases in `tests/test_database.py`; no e2e changes (infra-only).

### Completion Notes

- Epic complete (2026-06-07). Neon Postgres 18 (EU) on Render Frankfurt; persistence smoke passed; product v0.4.5.
- `python -m pytest` — 35 passed; coverage 94% (≥85%).
- Phase 2b CI Postgres job deferred to `deferred-work.md`; migrations verified on Neon via deploy.

### File List

- `app/database.py`
- `app/auth/config.py`
- `tests/test_database.py`
- `README.md`
- `.env.example`
- `VERSION`
- `CHANGELOG.md`
- `frontend/package.json`
- `_bmad-output/project-context.md`
- `_bmad-output/planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `_bmad-output/implementation-artifacts/plan-ci-cd-phases.md`

## Spec Change Log

| Date | Change |
|------|--------|
| 2026-06-07 | Initial draft from Party Mode + bmad-help recommendation (Winston Phase 3 discussion) |
| 2026-06-07 | Phases 1–3 implemented: production DB guard, tests, documentation |
| 2026-06-07 | Phases 4–5 complete: Neon+Render operator smoke, traceability closeout, v0.4.5 |

## Review Findings

### Review Findings (2026-06-07)

- [x] [Review][Patch] Whitespace-only `DATABASE_URL` bypasses production guard [`app/database.py:31`] — fixed: reject `not raw_url.strip()`; validate before `create_engine()`.

- [x] [Review][Patch] SQLite scheme check is case-sensitive [`app/database.py:32`] — fixed: `raw_url.strip().lower().startswith("sqlite")`.

- [x] [Review][Defer] Traceability docs still say Phase 3 deferred [`deferred-work.md`, `adr-004-ci-cd-and-preview-deployment.md`] — **resolved** Phase 5 closeout 2026-06-07.

- [x] [Review][Defer] Non-Postgres URL not positively validated [`app/database.py:32`] — deferred, out of spec scope; I/O matrix only requires rejecting missing/SQLite URLs.

- [x] [Review][Defer] `file:` database scheme not rejected [`app/database.py:32`] — deferred, out of spec scope; local dev uses `sqlite://` only.

- [x] [Review][Defer] `ENV=prod` alias not covered in test matrix [`tests/test_database.py`] — deferred, minor test gap; `_is_production()` behavior predates this change.

- [x] [Review][Defer] Phase 1 AC #4 (dev import unchanged) not directly asserted [`tests/test_database.py`] — deferred, existing suite passes; indirect coverage sufficient for v1.

### Review Findings — Re-run (2026-06-07)

- [x] [Review][Patch] README env table row for `ENVIRONMENT` is stale [`README.md:247`] — fixed: row now mentions `SECRET_KEY` and Postgres `DATABASE_URL` guard.

- [x] [Review][Defer] Padded Postgres URL not stripped before normalize [`app/database.py:33-34`] — deferred; guard uses `.strip()` but `DATABASE_URL` assignment does not; unlikely via Render dashboard paste.

- [x] [Review][Defer] Non-Postgres URL not positively validated — deferred (unchanged from first pass; out of spec I/O matrix).

- [x] [Review][Defer] Phases 4–5 operator + traceability closeout — **resolved** 2026-06-07.

**Re-run verdict:** Phases 1–3 code scope **clean**. Acceptance Auditor: all Phase 1 AC + prior patches verified. 35 pytest / 94% coverage.
