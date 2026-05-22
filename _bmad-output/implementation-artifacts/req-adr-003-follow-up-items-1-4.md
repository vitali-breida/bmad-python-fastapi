---
title: 'ADR-003 follow-up — items 1–4 (implementation scope)'
type: 'implementation-request'
created: '2026-05-21'
status: 'ready'
parent: 'adr-003-follow-up-edge-cases.md'
baseline: 'Auth v0.4.0 accepted; pytest 21 passed'
---

# REQ: ADR-003 follow-up — items 1–4 only

Use **this file alone** in a new chat. Do not implement anything from `adr-003-follow-up-edge-cases.md` outside the four packages below.

**Copy-paste for Cursor:** attach `@req-adr-003-follow-up-items-1-4.md` and say: *Implement all four packages in order; run pytest when done.*

---

## Out of scope (do not touch)

- E2E Playwright login→CRUD, rate limiting, `POST /auth/register`, refresh tokens, authz/RBAC/`owner_id`
- Frontend UX (multi-tab, idle expiry warning) unless a one-line README note is enough for package 1
- Unicode homoglyph policy, bcrypt 72-byte policy (document-only in package 1 if quick)
- Brownfield Alembic rename procedure (document-only in package 1 if quick)

---

## Package 1 — Documentation

**Goal:** Spec and ADR match current behavior and existing tests.

### 1.1 Spec — frozen I/O matrix (`spec-adr-003-jwt-authentication.md`)

Human approves editing `<frozen-after-approval>` for this task only.

**Add rows** to the I/O table (lines ~29–40):

| Scenario | Expected |
|----------|----------|
| Login: whitespace-only username after trim | 401, `detail` = `Incorrect username or password` |
| Login: empty password | 401, same generic body |
| Login: username &lt; 3 chars after trim | 401, same generic body |
| Login: wrong Content-Type (JSON) | 422 |
| Notes: no Bearer + invalid JSON body | 401 before body validation (document precedence) |
| `get_current_user`: invalid JWT | 401 `Could not validate credentials` |
| `get_current_user`: non-integer `sub` | 401 |
| `get_current_user`: expired JWT | 401 |
| `get_current_user`: valid JWT, user deleted | 401 |
| `get_current_user`: valid JWT, user deactivated after issue | 401 |
| `get_current_user`: `sub` integer ≤ 0 | 401 |
| `get_current_user`: malformed Authorization (not Bearer) | 401 |
| `get_current_user`: JWT missing `exp` | 401 |
| Valid JWT after password change until `exp` | 200 — document as accepted stateless limitation |

**Fix spec wording:** In Boundaries **Never**, change rate limiting to *“not implemented in authn v1 (optional follow-up per ADR)”* — align with ADR, not “never”.

**Extend Acceptance Criteria** with bullets mirroring the new matrix rows (at least login boundaries + JWT rows already covered by tests).

### 1.2 ADR (`adr-003-stateless-jwt-authentication.md`)

Patch **API contract** and **Data model** only (no architecture rewrite):

- Login: empty password, whitespace/short username → same 401 as unknown user
- `users.username`: max length **64** (match migration)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: valid range **1–10080**, invalid env → fail fast at startup
- `SECRET_KEY`: empty/whitespace treated as unset; document `ENVIRONMENT` / `ENV` values for prod (`production`, `prod`)
- `INITIAL_ADMIN_PASSWORD`: strip; reject empty/whitespace-only on upgrade
- Stateless JWT: password change does **not** revoke outstanding tokens until `exp`
- Security checklist: note decode uses **HS256 allowlist only** (already true in code)
- README pointer: `alembic downgrade` on `003` drops `users` (one sentence)

### 1.3 README (minimal)

Only if not already present: downgrade warning; env vars for `ENVIRONMENT` / validated ranges (can point to `.env.example`).

**Package 1 done when:** Spec matrix + acceptance updated; ADR contract lines added; no contradictions with `tests/test_auth.py`.

---

## Package 2 — Tests P1 (login boundaries)

**Goal:** Lock login edge behavior already implemented in `app/auth/users.py`.

**File:** `tests/test_auth.py`

| Test name (suggested) | Request | Assert |
|------------------------|---------|--------|
| `test_login_empty_password_returns_401` | Valid username, `password=""` | 401, `detail == INVALID_CREDENTIALS` |
| `test_login_whitespace_username_returns_401` | `username="   "`, any password | 401, same detail |
| `test_login_short_username_returns_401` | `username="ab"`, any password | 401, same detail |

Do **not** change production code unless a test fails; then minimal fix in `users.py` / router only.

---

## Package 3 — Tests P2 (JWT / Authorization header)

**Goal:** Cover gaps not yet in `test_auth.py`.

**File:** `tests/test_auth.py` (and `tests/conftest.py` only if needed)

| Test name (suggested) | Setup | Assert |
|------------------------|-------|--------|
| `test_list_notes_with_sub_zero_returns_401` | JWT `sub="0"`, valid `exp`, test secret | 401 credentials |
| `test_list_notes_with_missing_exp_claim_returns_401` | JWT with `sub` only (no `exp`) if PyJWT rejects | 401 |
| `test_list_notes_malformed_authorization_header_returns_401` | `Authorization: Token foo` or missing `Bearer` prefix | 401 |
| `test_auth_me_without_bearer_returns_401` | `GET /auth/me` no header | 401 |

Use same patterns as existing tests (`TEST_SECRET_KEY`, `auth_client`).

Optional: `test_protected_route_unauthenticated_invalid_json_body_returns_401` on `POST /notes` — only if FastAPI order is 401 first; document actual behavior in package 1 if 422.

---

## Package 4 — Hardening (config + migration)

**Goal:** Fail fast on bad env; safe bootstrap password.

### 4.1 `app/auth/config.py`

- `ACCESS_TOKEN_EXPIRE_MINUTES`: parse int; if missing use **60**; if not int or not in **1..10080** → `RuntimeError` with clear message at import
- `SECRET_KEY`: after read, `strip()`; empty → same as unset (prod still requires non-empty via existing `get_secret_key()` logic)
- Document supported prod detection: `ENVIRONMENT` or `ENV` in `production` / `prod` (behavior unchanged, clarity only)

### 4.2 `alembic/versions/003_add_users_table.py`

- `initial_password = os.getenv("INITIAL_ADMIN_PASSWORD")` → `strip()`
- If missing or empty after strip → same `RuntimeError` as today
- Optional: minimum length **8** for bootstrap password (if added, update README + `.env.example` one line)

### 4.3 `app/auth/deps.py` (small)

- After `user_id = int(sub)`, if `user_id <= 0` → 401 (explicit; same as missing user)

### 4.4 Shared `PasswordHash` (optional within this REQ)

If straightforward: export factory from `app/auth/security.py`, import in migration. If invasive, **skip** and leave note in PR — do not block packages 1–3.

### 4.5 Tests for config (if package 4.1 added)

- Add `tests/test_auth_config.py` or subprocess test: invalid `ACCESS_TOKEN_EXPIRE_MINUTES=0` fails on import — **only if easy**; otherwise manual check in PR notes.

**Package 4 done when:** `pytest` green; `alembic upgrade head` still works with valid `.env`.

---

## Verification (required)

```bash
pytest
```

Optional manual: `alembic upgrade head` with `INITIAL_ADMIN_PASSWORD` set.

**Success:** All existing + new tests pass; no breaking change to happy-path login or Mode B integration test.

---

## Suggested PR / chat order

1. Package 1 (docs) — can be same PR as 2–4 or separate “docs only” PR  
2. Package 2 (P1 tests)  
3. Package 3 (P2 tests)  
4. Package 4 (hardening) — may require updating package 1 env docs if min password length added  

One chat may implement **all four** in sequence; or one package per chat with: *“Implement Package N only from @req-adr-003-follow-up-items-1-4.md”*.

---

## Files likely touched

| Package | Files |
|---------|--------|
| 1 | `spec-adr-003-jwt-authentication.md`, `adr-003-stateless-jwt-authentication.md`, `README.md` |
| 2–3 | `tests/test_auth.py` |
| 4 | `app/auth/config.py`, `app/auth/deps.py`, `alembic/versions/003_add_users_table.py`, optionally `app/auth/security.py`, `tests/test_auth_config.py` |

---

## After completion

- Tick relevant rows in `adr-003-follow-up-edge-cases.md` or add one-line “done in PR #…” under each package (optional).
- Leave `deferred-work.md` items (E2E, rate limit) unchanged.
