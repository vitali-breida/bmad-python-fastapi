---
type: bmad-distillate
sources:
  - "../implementation-artifacts/adr-003-follow-up-edge-cases.md"
  - "../implementation-artifacts/req-adr-003-follow-up-items-1-4.md"
  - "../implementation-artifacts/deferred-work.md"
downstream_consumer: general
created: "2026-05-22"
token_estimate: 2629
parts: 1
---

## Document roles and routing

- **Implementation scope (sole chat attach):** `req-adr-003-follow-up-items-1-4.md` — packages 1–4 only; do not implement from edge-cases file outside those packages
- **Inventory / hunter backlog:** `adr-003-follow-up-edge-cases.md` — merged edge-case hunter on ADR-003 + `spec-adr-003-jwt-authentication.md`; reference only, not execution checklist
- **Deferred pointer:** `deferred-work.md` — links both files; code-review deferrals (E2E, PasswordHash dup, rate limit)
- **Upstream sources (hunter inputs):** `_bmad-output/planning-artifacts/adr/adr-003-stateless-jwt-authentication.md`; `_bmad-output/implementation-artifacts/spec-adr-003-jwt-authentication.md` (frozen I/O matrix ~lines 29–40)
- **Method:** `bmad-review-edge-case-hunter` (2026-05-21); merged ADR pass (22 gaps) + spec pass (8 + matrix staleness)

## Status and baseline

- **Auth implementation:** accepted for v0.4.0 authn; **21 pytest passing** at REQ creation (2026-05-21)
- **Follow-up classification:** gaps in spec/docs, missing tests, optional hardening, already-deferred work — **not blockers for v0.4.0 authn**
- **REQ status:** `ready`; parent = edge-cases doc
- **Frozen spec edit:** human must approve editing `<frozen-after-approval>` in spec for package 1 only

## Already implemented (do not re-implement)

| Scenario | Location |
|----------|----------|
| Username trim; length &lt; 3 → login 401 | `app/auth/users.py` (`get_user_by_username`) |
| Invalid/expired JWT; bad `sub`; missing user; post-deactivate | `tests/test_auth.py` |
| Migration fails without `INITIAL_ADMIN_PASSWORD` | `tests/test_migrations.py` |
| Idempotent `admin` seed | `tests/test_migrations.py` |
| HS256-only decode | `app/auth/security.py` (`algorithms=[ALGORITHM]`) |

## Executive inventory (edge-cases doc)

| Category | Count | Action |
|----------|------:|--------|
| Spec/docs sync (frozen matrix, ADR contract) | 12 | Renegotiate frozen spec block + patch ADR |
| Tests (behavior correct; coverage gaps) | 8 | `tests/test_auth.py` / config tests |
| Config / migration hardening | 5 | Small code + README |
| Already deferred (code review / ADR) | 3 | `deferred-work.md` |
| Explicit ADR deferrals (authn v1 out of scope) | 6 | Future ADR-00x |

**Highest value (edge-cases doc):** (1) extend I/O matrix + acceptance to match reality; (2) login boundary tests; (3) env validation at startup

## Package 1 — Documentation (REQ)

- **Goal:** spec + ADR match current behavior and existing tests
- **Spec file:** `spec-adr-003-jwt-authentication.md` — add I/O rows (login whitespace-only → 401 generic; empty password → 401; username &lt; 3 after trim → 401; wrong Content-Type JSON → 422; notes no Bearer + invalid JSON → **401 before** body validation; JWT invalid/non-int `sub`/expired/deleted user/deactivated/`sub`≤0/malformed Authorization/missing `exp` → 401; valid JWT after password change until `exp` → **200**, document stateless limitation)
- **Spec wording fix:** Boundaries **Never** — rate limiting → *"not implemented in authn v1 (optional follow-up per ADR)"* (resolves spec **Never** vs ADR optional deferral conflict)
- **Acceptance criteria:** extend with bullets mirroring new matrix rows (login boundaries + JWT rows already in tests)
- **ADR file:** `adr-003-stateless-jwt-authentication.md` — patch API contract + data model only: login empty/whitespace/short username → same 401; `users.username` max **64**; `ACCESS_TOKEN_EXPIRE_MINUTES` range **1–10080**, invalid env fail-fast at startup; `SECRET_KEY` empty/whitespace = unset; `ENVIRONMENT`/`ENV` prod values `production`/`prod`; `INITIAL_ADMIN_PASSWORD` strip, reject empty/whitespace on upgrade; password change does not revoke JWT until `exp`; security checklist HS256 allowlist; README one line: `alembic downgrade` on `003` drops `users`
- **README:** downgrade warning + env vars if missing (may point to `.env.example`)
- **Done when:** matrix + acceptance updated; ADR contract added; no contradiction with `tests/test_auth.py`
- **Doc-only quick adds (REQ out-of-scope unless quick):** unicode homoglyph policy; bcrypt 72-byte; brownfield Alembic id rename symptom

## Package 2 — Tests P1 login (REQ)

- **File:** `tests/test_auth.py`
- `test_login_empty_password_returns_401` — valid username, `password=""` → 401 `INVALID_CREDENTIALS`
- `test_login_whitespace_username_returns_401` — `username="   "` → 401 same detail
- `test_login_short_username_returns_401` — `username="ab"` → 401 same detail
- **Rule:** no prod code change unless test fails; then minimal fix in `users.py` / router

## Package 3 — Tests P2 JWT/header (REQ)

- **File:** `tests/test_auth.py` (`conftest.py` only if needed); patterns: `TEST_SECRET_KEY`, `auth_client`
- `test_list_notes_with_sub_zero_returns_401` — JWT `sub="0"`, valid `exp`
- `test_list_notes_with_missing_exp_claim_returns_401` — JWT `sub` only, no `exp` (if PyJWT rejects)
- `test_list_notes_malformed_authorization_header_returns_401` — `Authorization: Token foo` or no `Bearer`
- `test_auth_me_without_bearer_returns_401` — `GET /auth/me` no header
- **Optional:** `test_protected_route_unauthenticated_invalid_json_body_returns_401` on `POST /notes` — only if FastAPI returns 401 first; else document 422 in package 1

## Package 4 — Hardening (REQ) — runtime risk

- **4.1 `app/auth/config.py`:** `ACCESS_TOKEN_EXPIRE_MINUTES` int, default **60**, range **1..10080** else `RuntimeError` at import; `SECRET_KEY` strip, empty = unset; document prod `ENVIRONMENT`/`ENV`
- **4.2 `alembic/versions/003_add_users_table.py`:** `INITIAL_ADMIN_PASSWORD` strip; missing/empty after strip → `RuntimeError`; optional min length **8** (+ README, `.env.example`)
- **4.3 `app/auth/deps.py`:** after `int(sub)`, if `user_id <= 0` → 401
- **4.4 optional:** shared `PasswordHash` from `app/auth/security.py` in migration — skip if invasive, do not block 1–3
- **4.5 optional:** `tests/test_auth_config.py` or subprocess — invalid `ACCESS_TOKEN_EXPIRE_MINUTES=0` fails import
- **Done when:** pytest green; `alembic upgrade head` with valid `.env`; no happy-path login / Mode B regression

## REQ out of scope (all packages)

- E2E Playwright login→CRUD; rate limiting; `POST /auth/register`; refresh tokens; authz/RBAC/`owner_id`
- Frontend UX (multi-tab, idle expiry) unless one-line README in package 1
- Unicode homoglyph / bcrypt 72-byte / brownfield Alembic rename — document-only in package 1 if quick

## REQ verification and PR order

- **Required:** `pytest` (full suite)
- **Optional manual:** `alembic upgrade head` with `INITIAL_ADMIN_PASSWORD`
- **Success:** all existing + new tests pass; no breaking happy-path login or Mode B integration test
- **Suggested order:** package 1 → 2 → 3 → 4 (one chat all four, or one package per chat)
- **Files touched:** pkg1 `spec-adr-003-jwt-authentication.md`, `adr-003-stateless-jwt-authentication.md`, `README.md`; pkg2–3 `tests/test_auth.py`; pkg4 `app/auth/config.py`, `app/auth/deps.py`, `alembic/versions/003_add_users_table.py`, optionally `app/auth/security.py`, `tests/test_auth_config.py`
- **After completion:** optional tick rows in edge-cases doc or PR note; leave `deferred-work.md` E2E/rate limit unchanged

## Hunter backlog — spec/docs (category A, not all in REQ packages)

- **A1 matrix gaps beyond REQ list:** login JSON → 422; protected route auth-before-body precedence; sync matrix with review tests (invalid JWT, non-int `sub`, expired, deleted user, deactivated after issue)
- **A2 ADR contract gaps:** max username validation rule; bcrypt 72-byte policy; brownfield Alembic id failure symptom; unicode/homoglyph normalization policy (register ADR)
- **A3 frontend (ADR §Frontend):** token expires during edit → 401 on save; multi-tab `sessionStorage` desync — document acceptable or `storage` event sync
- **A4 spec inconsistencies:** frozen matrix stale vs `test_auth.py`; acceptance missing JWT criteria; Phase 6 UI complete vs optional full login→CRUD E2E

## Hunter backlog — tests (category B)

| Priority | Test | Rationale |
|----------|------|-----------|
| P1 | empty password, whitespace username, short username | matrix gap; avoid 422 drift |
| P2 | `sub` zero, missing `exp`, malformed Authorization, `/auth/me` no bearer | JWT/header gaps |
| P3 | invalid `ACCESS_TOKEN_EXPIRE_MINUTES` fails fast | config — overlaps package 4 |

(P1/P2 largely duplicated in REQ packages 2–3; P3 = package 4)

## Hunter backlog — code hardening (category C)

- Env validation in `config.py` (expire range, blank `SECRET_KEY`)
- Migration seed `initial_password.strip()` + min length
- Shared `PasswordHash` (see deferred)
- Optional explicit `user_id <= 0` in `deps.py` (package 4)

## Deferred — keep in `deferred-work.md`

- Playwright E2E login → notes CRUD (ADR optional; spec review defer)
- Duplicate `PasswordHash` in migration vs `app/auth/security.py` (spec review defer)
- Rate limiting on `/auth/login` (ADR security checklist `[ ]`)
- ADR security checklist otherwise ticked on implementation acceptance (2026-05-21)

## Explicit ADR deferrals — authn v1 (category E, do not implement)

- Authorization (RBAC, `owner_id`, 403)
- `POST /auth/register`, refresh tokens, logout endpoint, OIDC
- Session cookies, audit log
- Production CORS / cross-origin proxy
- JWT clock skew (`leeway`)
- Token denylist / revocation

## Suggested execution order (edge-cases doc)

1. Docs PR: ADR API contract + security notes; renegotiate spec frozen I/O + acceptance
2. Tests PR: P1 login boundaries; optional P2 JWT/header
3. Optional hardening PR: config + migration env validation; shared `PasswordHash`
4. Deferred backlog: E2E login→CRUD, rate limiting when prioritizing CI confidence

## Hunter findings F — all triggers (machine-readable merge)

- I/O matrix: whitespace-only or short username login → 401 generic; guard trim then len&lt;3
- I/O matrix: empty password login → 401 generic
- `get_current_user`: JWT `sub` zero or negative → 401 after parse
- JWT: missing or invalid `exp` → 401
- `config`: invalid `ACCESS_TOKEN_EXPIRE_MINUTES` → startup validate 1–10080
- `config`: `SECRET_KEY` empty/whitespace → fail fast / treat unset
- `migration`: `INITIAL_ADMIN_PASSWORD` whitespace-only → strip + reject below min
- Data model: username exceeds column max → document max 64 + validate
- Passwords: over bcrypt 72 bytes → document reject or pre-hash policy
- Protected routes: no auth + invalid JSON body → document 401 before 422 precedence
- Login: Content-Type not form-urlencoded → document 422 for JSON
- Migration: `alembic downgrade` on `003` drops `users` → README warning
- Brownfield: old `alembic_version` strings → document upgrade failure + fix steps
- Consequences: password changed, old JWT valid until `exp` → document no revocation
- Frontend: token expires during SPA edit → 401 on save; optional idle UX
- Frontend: multi-tab `sessionStorage` desync → document scope
- Spec frozen matrix: omits review-pass JWT tests → renegotiate frozen block
- Spec **Never** vs ADR: rate limiting wording → align v1 out of scope
- Security: JWT `alg` confusion → checklist HS256 decode allowlist only
- Users: unicode homoglyph usernames → normalization policy in future authz ADR

## Sign-off (edge-cases)

- Edge Case Hunter (ADR) 2026-05-21: 22 ADR spec gaps
- Edge Case Hunter (spec) 2026-05-21: 8 spec-specific + matrix staleness
- Merged follow-up doc 2026-05-21

## Key file paths (implementation)

- `app/auth/config.py`, `security.py`, `users.py`, `deps.py`, `routers/auth.py`
- `alembic/versions/003_add_users_table.py`
- `tests/test_auth.py`, `tests/test_migrations.py`
