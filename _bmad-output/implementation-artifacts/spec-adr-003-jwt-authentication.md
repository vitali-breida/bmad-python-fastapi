---
title: 'ADR-003 Stateless JWT authentication'
type: 'feature'
created: '2026-05-21'
status: 'accepted'
accepted: '2026-05-21'
baseline_commit: '1dde865df369edb2379fa06bedceaf4bf25bd3da'
context:
  - '{project-root}/_bmad-output/planning-artifacts/adr/adr-003-stateless-jwt-authentication.md'
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Notes API exposes anonymous CRUD on `/notes`. We need production-realistic authentication so only identified users can call protected endpoints.

**Approach:** Add stateless JWT auth (HS256, Bearer header) per ADR-003: login via OAuth2 password form, `get_current_user` dependency on all `/notes` and `GET /auth/me`, bootstrap `admin` via Alembic `003_add_users_table`. Implement in **seven ADR phases** with a human checkpoint after each phase before starting the next.

## Boundaries & Constraints

**Always:** Thin routers; user lookup in `app/auth/users.py` (not `store.py`); `UserRow` / `UserRead` split like notes; trim username on login; generic 401 for wrong password, unknown user, and inactive user; `SECRET_KEY` required in prod (fail fast); revision id `003_add_users_table`; bump API to **v0.4.0**; test overrides for `get_current_user` like `get_db`.

**Ask First:** Committing or stashing unrelated dirty-tree changes; brownfield DBs still on old Alembic revision strings (`001baseline` / `002updated_at`).

**Never:** `owner_id` on notes, RBAC/403, refresh tokens, `POST /auth/register`, session cookies, rate limiting, JWT roles in payload.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login OK | Valid username/password, `is_active=true` | 200 `{access_token, token_type:bearer}` | N/A |
| Login fail | Wrong password, unknown user, or `is_active=false` | 401 generic invalid credentials | Same body for all |
| Notes without token | No `Authorization` | 401 on all `/notes/*` | N/A |
| Notes with token | Valid Bearer after login | 200/201/204 per existing CRUD | 404 unchanged for missing note |
| `/auth/me` | Valid Bearer | 200 `UserRead` (no hash) | 401 if missing/invalid |
| `get_current_user` | JWT `sub` non-integer or user gone | 401 | Never 500 on bad `sub` |
| Migration seed | `INITIAL_ADMIN_PASSWORD` unset | `alembic upgrade` fails with clear message | Idempotent skip if `admin` exists |
| Public | `GET /health`, `POST /auth/login` | 200 without Bearer | N/A |

</frozen-after-approval>

## Code Map

- `app/main.py` -- mount `auth` router; version `0.4.0`
- `app/db_models.py` -- add `UserRow`
- `app/models.py` -- `Token`, `UserRead`
- `app/auth/config.py` -- env: `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, algorithm
- `app/auth/security.py` -- pwdlib hash/verify, PyJWT create/decode
- `app/auth/users.py` -- `get_user_by_username` (trim), `get_user_by_id`
- `app/auth/deps.py` -- `oauth2_scheme`, `get_current_user`
- `app/routers/auth.py` -- `POST /auth/login`, `GET /auth/me`
- `app/routers/notes.py` -- `Depends(get_current_user)` on all handlers
- `alembic/versions/003_add_users_table.py` -- `users` table + seed `admin`
- `requirements.txt` -- `PyJWT`, `pwdlib[bcrypt]`
- `tests/conftest.py` -- `test_user` fixture; clear `get_current_user` override
- `tests/test_auth.py` -- login, 401, mode B integration (new)
- `tests/test_notes.py` -- override `get_current_user` (mode A)
- `tests/test_migrations.py` -- `users` table + seed assertion
- `frontend/vite.config.ts` -- proxy `/auth` (phase 6)
- `README.md`, `.env.example` -- breaking change + env vars
- `_bmad-output/project-context.md` -- auth scope (phase 7)

## Tasks & Acceptance

**Phase 1 — Dependencies + config**
- [x] `requirements.txt` -- add `PyJWT`, `pwdlib[bcrypt]` -- JWT and password hashing
- [x] `app/auth/__init__.py`, `app/auth/config.py` -- load `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60); prod missing `SECRET_KEY` fails at import/use
- [x] `.env.example` -- document `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `INITIAL_ADMIN_PASSWORD` (dev placeholder only)

**Phase 2 — Schema**
- [x] `app/db_models.py` -- `UserRow` (`username` unique indexed, `hashed_password`, `is_active` default true)
- [x] `alembic/versions/003_add_users_table.py` -- `revision = "003_add_users_table"`, `down_revision = "002_add_notes_updated_at"`; seed `admin` from `INITIAL_ADMIN_PASSWORD` (fail if unset; idempotent)
- [x] `app/models.py` -- `Token`, `UserRead` (no password field)
- [x] `app/main.py`, `README.md` -- version **0.4.0**; README breaking-change note for Bearer on `/notes`

**Phase 3 — Auth core**
- [x] `app/auth/security.py` -- hash, verify, `create_access_token` (`sub`, `exp` UTC), decode
- [x] `app/auth/users.py` -- lookup helpers with username trim
- [x] `app/auth/deps.py` -- `OAuth2PasswordBearer`, `get_current_user` (+ `get_db`, DB reload, inactive → 401)
- [x] `app/routers/auth.py` -- login + `/auth/me`
- [x] `app/main.py` -- include auth router

**Phase 4 — Protect notes**
- [x] `app/routers/notes.py` -- `current_user: UserRow = Depends(get_current_user)` on every handler

**Phase 5 — Tests**
- [x] `tests/conftest.py` -- `test_user` fixture; teardown clears `get_current_user` override
- [x] `tests/test_auth.py` -- login 200/401, `/auth/me`, `GET /notes` without token → 401, `test_login_then_list_notes` (mode B)
- [x] `tests/test_notes.py` (or existing note tests) -- mode A via `get_current_user` override
- [x] `tests/test_migrations.py` -- upgrade head → `users` exists; seed `admin` when env set

**Phase 6 — UI** (checkpoint: may ship as follow-up PR)
- [x] `frontend/vite.config.ts` -- proxy `/auth`
- [x] `frontend/src/` -- login page, `sessionStorage` token, API wrapper Bearer, 401 → clear + login route

**Phase 7 — Project context**
- [x] `_bmad-output/project-context.md` -- auth in scope; `app/auth/` layout; overrides; Vite `/auth` proxy

**Acceptance Criteria:**
- Given no Bearer token, when calling any `/notes` endpoint, then response is 401.
- Given seeded user and correct password, when `POST /auth/login`, then 200 with `access_token`.
- Given valid token, when `GET /auth/me`, then 200 with `id` and `username` only.
- Given valid token from login, when `GET /notes`, then 200 (mode B test).
- Given wrong password or inactive user, when login, then 401 with same generic message.
- Given `alembic upgrade head` with `INITIAL_ADMIN_PASSWORD` set, when checking DB, then `users` table exists and `admin` row present (idempotent re-run safe).

## Design Notes

Execute **one ADR phase at a time** (1→7). After each phase: run verification commands, report summary, **HALT** for `[N]ext phase` before continuing.

Phases 1–5 are the API milestone; phase 6 is full-stack UI; phase 7 is agent docs only.

## Verification

**Commands:**
- `pytest` -- expected: all tests pass after phases 5+
- `alembic upgrade head` (with env) -- expected: `003_add_users_table` applied
- `curl -X POST http://127.0.0.1:8000/auth/login -d "username=admin&password=..."` -- expected: 200 + token (manual smoke after phase 3)

**Manual checks:**
- `/docs` → Authorize → `GET /notes` returns 200 with token, 401 without.

### Review Findings

*Code review 2026-05-21 (baseline `1dde865`, + untracked `app/auth/`, `app/routers/auth.py`, `tests/test_auth.py`, frontend auth modules). `pytest`: 13 passed.*

- [x] [Review][Patch] Missing tests for invalid JWT and non-integer `sub` [`tests/test_auth.py`] — Added invalid token, bad `sub`, and post-deactivation tests.
- [x] [Review][Patch] Missing test for unknown username login [`tests/test_auth.py`] — Added `test_login_unknown_user_returns_401`.
- [x] [Review][Patch] `test_auth_me_with_valid_token` hardcodes `id: 1` [`tests/test_auth.py`] — Asserts `test_user.id`.
- [x] [Review][Patch] No test for idempotent migration re-run [`tests/test_migrations.py`] — Added `test_upgrade_head_idempotent_admin_seed`.
- [x] [Review][Defer] E2E does not exercise login → notes CRUD [`frontend/e2e/notes-smoke.spec.ts`] — deferred, ADR marks full Playwright auth smoke as optional follow-up; current test only checks login shell.
- [x] [Review][Defer] Duplicate `PasswordHash` setup in migration and `app/auth/security.py` [`alembic/versions/003_add_users_table.py`, `app/auth/security.py`] — deferred, works today; shared helper would reduce drift risk.
- [x] [Review][Defer] ADR security checklist still unchecked in planning ADR [`adr-003-stateless-jwt-authentication.md`] — deferred, README partially documents XSS/`sessionStorage`; formal checklist tick-off is docs hygiene, not a code defect.

*Code review 2026-05-21 — second pass (after first-round patches). Scope: ADR-003 full implementation vs `spec-adr-003-jwt-authentication.md`. `pytest`: 18 passed.*

- [x] [Review][Patch] README "Try the API" curl examples omit login and Bearer token [`README.md:68-72`] — Added login step and Bearer examples.
- [x] [Review][Patch] No test that `alembic upgrade` fails when `INITIAL_ADMIN_PASSWORD` is unset [`tests/test_migrations.py`] — Added `test_upgrade_head_fails_without_initial_admin_password`.
- [x] [Review][Patch] No test for expired JWT [`tests/test_auth.py`] — Added `test_list_notes_with_expired_token_returns_401`.
- [x] [Review][Patch] No test for valid JWT when user row is missing (deleted id) [`tests/test_auth.py`] — Added `test_list_notes_with_missing_user_sub_returns_401`.
- [x] [Review][Defer] E2E login → notes CRUD smoke [`frontend/e2e/notes-smoke.spec.ts`] — still deferred per ADR optional follow-up; login shell test only.
- [x] [Review][Defer] Duplicate `PasswordHash` in migration vs `security.py` — unchanged from first pass; low drift risk today.
- [x] [Review][Defer] ADR security checklist unchecked in planning doc — unchanged; README covers main points.

*Code review 2026-05-21 — third pass (confirmation). `pytest`: 21 passed. No new findings.*

**Implementation accepted 2026-05-21** — all seven phases complete; optional follow-ups (E2E login→CRUD, shared `PasswordHash` helper) remain in `deferred-work.md`.
