---
title: 'Notes API — FastAPI learning skeleton'
type: 'feature'
created: '2026-05-18'
status: 'done'
baseline_commit: 'NO_VCS'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The project has BMad tooling but no runnable FastAPI code, so hands-on learning of routes, validation, and HTTP semantics is blocked.

**Approach:** Deliver a minimal Notes CRUD API with Pydantic models, in-memory storage, OpenAPI docs, pytest coverage, and a README with run instructions.

## Boundaries & Constraints

**Always:** Python 3.11+ style; explicit HTTP status codes; `HTTPException` for 404; no database in this slice; tests must pass via `pytest`.

**Ask First:** Adding auth, persistence (SQLite/Postgres), or frontend.

**Never:** Production secrets in repo; ORM/migrations; Docker in v1.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| List notes | Empty store | `200`, `[]` | N/A |
| Create note | Valid `title`, optional `body` | `201`, note with `id` | `422` on invalid payload |
| Get note | Existing `id` | `200`, note | `404` if missing |
| Update note | Existing `id`, partial fields | `200`, updated note | `404` if missing; `422` on invalid |
| Delete note | Existing `id` | `204`, empty body | `404` if missing |
| Health | GET `/health` | `200`, `status: ok` + `version` (product semver) | N/A |

</frozen-after-approval>

## Code Map

- `app/main.py` -- FastAPI app factory, router mount, `/health`
- `app/models.py` -- Pydantic request/response schemas
- `app/store.py` -- In-memory note repository
- `app/routers/notes.py` -- CRUD routes under `/notes`
- `tests/test_notes.py` -- API tests via `TestClient`
- `requirements.txt` -- Runtime and test dependencies
- `README.md` -- Setup and curl examples

## Tasks & Acceptance

**Execution:**
- [x] `requirements.txt` -- Pin FastAPI, uvicorn, pytest, httpx
- [x] `app/models.py` -- NoteCreate, NoteUpdate, Note schemas
- [x] `app/store.py` -- Thread-safe in-memory CRUD with auto-increment ids
- [x] `app/routers/notes.py` -- REST endpoints for notes
- [x] `app/main.py` -- Application entry and health route
- [x] `tests/test_notes.py` -- Happy path and 404 coverage
- [x] `README.md` -- venv, install, run, test, link to `/docs`

**Acceptance Criteria:**
- Given the server is running, when GET `/docs` is opened, then OpenAPI UI loads.
- Given no notes exist, when POST `/notes` with `{"title":"Learn FastAPI"}`, then response is `201` with `id`, `title`, `body`.
- Given a note exists, when DELETE `/notes/{id}` then GET same id, then `204` then `404`.
- Given the project root, when `pytest` runs, then all tests pass.

## Spec Change Log

## Verification

**Commands:**
- `python -m pytest` -- expected: all tests pass
- `python -m uvicorn app.main:app --reload` -- expected: server starts; `/health` returns ok

## Suggested Review Order

- Pydantic schemas define the API contract
  [`models.py:4`](../../app/models.py#L4)

- In-memory store with ids and test reset hook
  [`store.py:8`](../../app/store.py#L8)

- CRUD routes and HTTP status codes
  [`notes.py:9`](../../app/routers/notes.py#L9)

- App assembly and health probe
  [`main.py:6`](../../app/main.py#L6)

- End-to-end API tests
  [`test_notes.py:18`](../../tests/test_notes.py#L18)
