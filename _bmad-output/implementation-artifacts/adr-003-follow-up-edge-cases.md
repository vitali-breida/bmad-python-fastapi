# ADR-003 / spec-adr-003 — follow-up edge cases & improvements

**Created:** 2026-05-21  
**Method:** `bmad-review-edge-case-hunter` on:

- `_bmad-output/planning-artifacts/adr/adr-003-stateless-jwt-authentication.md`
- `_bmad-output/implementation-artifacts/spec-adr-003-jwt-authentication.md` (frozen I/O matrix + acceptance + verification)

**Implementation status:** Accepted (21 tests passing). Items below are **gaps in spec/docs**, **missing tests**, **optional hardening**, or **already-deferred** work — not blockers for v0.4.0 authn.

**Related:** `deferred-work.md` (code-review deferrals), ADR §Deferred, spec Review Findings.

**Implementation scope (items 1–4 only):** [`req-adr-003-follow-up-items-1-4.md`](req-adr-003-follow-up-items-1-4.md) — use this in a new chat; ignore the rest of this file unless extending scope.

---

## Executive summary

| Category | Count | Action |
|----------|------:|--------|
| Spec/docs sync (frozen matrix, ADR contract) | 12 | Human renegotiate frozen spec block + patch ADR |
| Tests (behavior correct; coverage gaps) | 8 | Add to `tests/test_auth.py` / config tests |
| Config / migration hardening | 5 | Small code + README |
| Already deferred (code review / ADR) | 3 | Keep in `deferred-work.md` |
| Explicit ADR deferrals (no action in authn v1) | 6 | Track for ADR-00x / later |

**Highest value next:** (1) extend I/O matrix + acceptance criteria so spec matches reality, (2) login boundary tests, (3) env validation at startup.

---

## Already covered (do not re-implement)

Implementation and tests already handle much of what the ADR implies but does not spell out:

| Scenario | Where |
|----------|--------|
| Username trim + length &lt; 3 → login 401 | `app/auth/users.py` (`get_user_by_username`) |
| Invalid / expired JWT, bad `sub`, missing user, post-deactivate | `tests/test_auth.py` |
| Migration fails without `INITIAL_ADMIN_PASSWORD` | `tests/test_migrations.py` |
| Idempotent `admin` seed | `tests/test_migrations.py` |
| HS256-only decode | `app/auth/security.py` (`algorithms=[ALGORITHM]`) |

---

## A. Documentation & spec sync (recommended)

These are **unhandled in ADR and/or the frozen spec I/O matrix** (`spec-adr-003-jwt-authentication.md` lines 29–40). Updating the frozen block requires an explicit human renegotiation per `<frozen-after-approval>`.

### A1. Expand I/O & Edge-Case Matrix

Add rows (expected behavior aligned with current code unless noted):

| Scenario | Expected |
|----------|----------|
| Login: username only whitespace after trim | 401, same `INVALID_CREDENTIALS` body |
| Login: empty password | 401, same generic body |
| Login: username &lt; 3 chars after trim | 401 (treat as unknown user) |
| Login: wrong `Content-Type` (e.g. JSON) | 422 (FastAPI default) — document explicitly |
| Protected route: no Bearer + invalid JSON body | **401 before** body validation — document precedence |
| `get_current_user`: `sub` integer ≤ 0 | 401 |
| `get_current_user`: JWT missing `exp` or invalid `exp` | 401 |
| `get_current_user`: malformed `Authorization` (not `Bearer …`) | 401 |
| Valid JWT after password change (until `exp`) | Still 200 — **document accepted risk** |
| `alembic downgrade` on `003_add_users_table` | Drops `users` — warn in README |

Also **sync matrix with tests already written** (present in code review, absent from frozen matrix):

- Invalid JWT string
- Non-integer `sub`
- Expired JWT
- Valid JWT, user id deleted
- Valid JWT, user deactivated after issue

### A2. ADR API contract & data model gaps

| Topic | Suggestion |
|-------|------------|
| Max username length | ADR table: `String(64)` (already in migration); add max + validation rule |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Valid range at startup (e.g. 1–10080); reject 0, negative, non-numeric |
| `SECRET_KEY` | Reject empty/whitespace; document `ENVIRONMENT` / `ENV` values for prod gate |
| `INITIAL_ADMIN_PASSWORD` | Reject empty/whitespace-only after strip (migration + docs) |
| Bcrypt 72-byte limit | Document reject or policy for overlong passwords |
| Brownfield Alembic ids | Document failure symptom when `001baseline` not renamed |
| Unicode / homoglyph usernames | Policy: no normalization vs NFC — pick one for register ADR |
| JWT `alg` allowlist | Security checklist: decode `algorithms=["HS256"]` only (implementation OK; spec line) |

### A3. Frontend / SPA (ADR §Frontend)

| Scenario | Gap |
|----------|-----|
| Token expires during edit | UX: 401 on save clears token; optional idle warning — not specified |
| Multi-tab login/logout | `sessionStorage` per tab — document desync as acceptable or add `storage` event sync |

### A4. Spec inconsistencies to resolve

| Issue | Detail |
|-------|--------|
| Rate limiting | Spec **Never** includes rate limiting; ADR defers it as optional follow-up. Align wording (e.g. “not in v1 implementation”). |
| Frozen matrix stale | Review patches added tests not reflected in lines 29–40. |
| Acceptance criteria | Missing criteria for JWT edge cases now in `test_auth.py`. |
| Phase 6 vs E2E | Spec marks UI complete; full login→CRUD E2E still optional per ADR — call out in acceptance. |

---

## B. Tests to add (behavior mostly correct today)

| Priority | Test | Rationale |
|----------|------|-----------|
| P1 | `test_login_empty_password_returns_401` | Matrix gap; avoids 422 drift |
| P1 | `test_login_whitespace_username_returns_401` | Trim + min length |
| P1 | `test_login_short_username_returns_401` | e.g. `"ab"` + any password |
| P2 | `test_notes_with_sub_zero_returns_401` | JWT `sub: "0"` |
| P2 | `test_notes_with_missing_exp_claim_returns_401` | If PyJWT allows — lock behavior |
| P2 | `test_notes_malformed_authorization_header_returns_401` | e.g. `Authorization: Token xyz` |
| P2 | `test_auth_me_without_bearer_returns_401` | Symmetry with `/notes` |
| P3 | Config: invalid `ACCESS_TOKEN_EXPIRE_MINUTES` fails fast | Subprocess or env fixture |

---

## C. Code / config hardening (small diffs)

| Item | Change |
|------|--------|
| Env validation | `app/auth/config.py`: validate `ACCESS_TOKEN_EXPIRE_MINUTES` range; strip/reject blank `SECRET_KEY` |
| Migration seed | `003_add_users_table.py`: `initial_password.strip()` + minimum length check |
| Shared `PasswordHash` | Single factory in `app/auth/security.py`, import from migration (see deferred-work) |
| `user_id <= 0` in `deps.py` | Explicit 401 after `int(sub)` (optional — `db.get` already misses) |

---

## D. Already deferred — keep in `deferred-work.md`

| Item | Source |
|------|--------|
| Playwright E2E: login → notes CRUD | ADR optional; spec review defer |
| Duplicate `PasswordHash` in migration vs `security.py` | Spec review defer |
| Rate limiting on `/auth/login` | ADR §Security checklist `[ ]` |

---

## E. Explicit ADR deferrals (out of scope for this doc’s implementation work)

Do not implement under authn v1; track in future ADR/tasks:

- Authorization (RBAC, `owner_id`, 403)
- `POST /auth/register`, refresh tokens, logout endpoint, OIDC
- Session cookies, audit log
- Production CORS / cross-origin proxy
- JWT clock skew (`leeway`)
- Token denylist / revocation

---

## F. Consolidated hunter findings (machine-readable)

ADR-only and spec-only passes merged; duplicates collapsed.

```json
[
  {"location":"adr-003 + spec:I/O matrix","trigger_condition":"Whitespace-only or short username login","guard_snippet":"Matrix row: trim then len<3 → 401 generic","potential_consequence":"Spec drift from users.py behavior"},
  {"location":"adr-003 + spec:I/O matrix","trigger_condition":"Empty password on login","guard_snippet":"Matrix row: empty password → 401 generic","potential_consequence":"Untested 401 vs 422 regression"},
  {"location":"adr-003 + spec:get_current_user","trigger_condition":"JWT sub integer zero or negative","guard_snippet":"user_id <= 0 → 401 after parse","potential_consequence":"Unspecified ORM edge behavior"},
  {"location":"adr-003 + spec:JWT","trigger_condition":"Missing or invalid exp claim","guard_snippet":"Require exp; decode failure → 401","potential_consequence":"Ambiguous token lifetime acceptance"},
  {"location":"adr-003:config","trigger_condition":"ACCESS_TOKEN_EXPIRE_MINUTES invalid","guard_snippet":"Startup validate integer in allowed range","potential_consequence":"Import crash or instant token expiry"},
  {"location":"adr-003:config","trigger_condition":"SECRET_KEY empty or whitespace","guard_snippet":"Treat blank as unset; fail fast","potential_consequence":"Weak signing key in deployment"},
  {"location":"adr-003:migration","trigger_condition":"INITIAL_ADMIN_PASSWORD whitespace-only","guard_snippet":"Strip and reject below min length","potential_consequence":"Unusable admin bootstrap password"},
  {"location":"adr-003:data model","trigger_condition":"Username exceeds column max","guard_snippet":"Document max 64 in ADR and validate","potential_consequence":"DB errors on long usernames"},
  {"location":"adr-003:passwords","trigger_condition":"Password over bcrypt 72 bytes","guard_snippet":"Document reject or pre-hash policy","potential_consequence":"Verify failures or silent truncation"},
  {"location":"adr-003 + spec:protected routes","trigger_condition":"No auth plus invalid JSON body","guard_snippet":"Document 401 before 422 precedence","potential_consequence":"Clients misread unauthenticated errors"},
  {"location":"adr-003:login","trigger_condition":"Content-Type not form-urlencoded","guard_snippet":"Document 422 for JSON login attempts","potential_consequence":"SPA misconfiguration confusion"},
  {"location":"adr-003:migration","trigger_condition":"alembic downgrade drops users","guard_snippet":"README warning on downgrade data loss","potential_consequence":"Operator data loss"},
  {"location":"adr-003:brownfield","trigger_condition":"Old alembic_version strings","guard_snippet":"Document upgrade failure and fix steps","potential_consequence":"Opaque migration failures"},
  {"location":"adr-003:consequences","trigger_condition":"Password changed old JWT valid","guard_snippet":"Document until exp no revocation","potential_consequence":"Operators expect immediate session kill"},
  {"location":"adr-003:frontend","trigger_condition":"Token expiry during SPA session","guard_snippet":"401 handling plus optional idle UX","potential_consequence":"Lost edits without guidance"},
  {"location":"adr-003:frontend","trigger_condition":"Multi-tab token desync","guard_snippet":"Document sessionStorage scope","potential_consequence":"Stale tab sends invalid token"},
  {"location":"spec:frozen matrix","trigger_condition":"Matrix omits tests from review passes","guard_snippet":"Renegotiate frozen block add JWT rows","potential_consequence":"Future agents implement wrong contract"},
  {"location":"spec:Never vs ADR","trigger_condition":"Rate limiting never vs deferred","guard_snippet":"Align v1 out of scope wording","potential_consequence":"Contradictory guidance for contributors"},
  {"location":"adr-003:security","trigger_condition":"JWT alg confusion","guard_snippet":"Checklist decode allowlist HS256","potential_consequence":"Misconfigured decoder later"},
  {"location":"adr-003:users","trigger_condition":"Unicode homoglyph usernames","guard_snippet":"Normalization policy in authz ADR","potential_consequence":"Duplicate visible usernames"}
]
```

---

## Suggested execution order

1. **Docs (1 PR):** Patch ADR API contract + security notes; renegotiate and extend spec frozen I/O matrix + acceptance criteria.
2. **Tests (1 PR):** P1 login boundary tests; optional P2 JWT/header edge tests.
3. **Hardening (optional PR):** Config + migration env validation; shared `PasswordHash`.
4. **Deferred backlog:** E2E login→CRUD, rate limiting — when prioritizing hardening or CI confidence.

---

## Sign-off

| Review | Date | Notes |
|--------|------|-------|
| Edge Case Hunter (ADR) | 2026-05-21 | 22 ADR spec gaps |
| Edge Case Hunter (spec) | 2026-05-21 | 8 spec-specific + matrix staleness |
| Merged follow-up doc | 2026-05-21 | This file |
