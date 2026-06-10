# Security posture — Notes API

Human-readable summary of authentication and deployment security choices for this learning project. **Implementation facts remain canonical in [ADR-003](../_bmad-output/planning-artifacts/adr/adr-003-stateless-jwt-authentication.md)**; this document explains trade-offs for portfolio reviewers without reading the full ADR chain.

**Audience:** technical reviewers, future contributors, and the author validating deliberate choices — not end-user product documentation.

---

## 1. Purpose & scope

This app is a **FastAPI + React learning playground** deployed on Render's free tier with **no real users**, **no multi-tenant production**, and **no sensitive data**. Security decisions prioritize **realistic patterns** (JWT, migrations, production guards) over hardening a public SaaS.

What this doc covers: auth model, token storage, same-origin networking, secrets, production startup checks, and **explicitly deferred** hardening (headers, rate limiting).

---

## 2. Threat model (honest scope)

| In scope | Out of scope (v1) |
|----------|-------------------|
| Credential guessing on public preview login | Multi-tenant isolation, row-level authorization |
| Token theft via XSS if a script injection bug exists | Nation-state adversaries, DDoS |
| Misconfiguration (missing `SECRET_KEY`, SQLite in prod) | Refresh tokens, token revocation denylist |
| Accidental secret commit | RBAC / role-based access control |

The preview URL is **intentionally public** for portfolio demonstration. Bootstrap `admin` credentials are set via environment variables — treat the preview as a demo, not a secrets vault.

---

## 3. Authentication model

**Choice:** stateless **JWT access tokens** (HS256), no server-side session store.

| Aspect | Behavior |
|--------|----------|
| Login | `POST /auth/login` — OAuth2 password form → signed JWT |
| Protected API | `Authorization: Bearer <token>` on all `/notes/*` routes |
| Validation | Signature + `exp`; then DB lookup of `sub` → active `UserRow` |
| Logout | Client discards token — no server revoke endpoint (stateless) |

Wrong password, unknown user, inactive user, bad token, expired token → **401** with generic messages (no account enumeration).

**Deep dive:** [ADR-003 — Stateless JWT authentication](../_bmad-output/planning-artifacts/adr/adr-003-stateless-jwt-authentication.md)

---

## 4. Client token storage (`sessionStorage`)

The React SPA stores the access token in **`sessionStorage`** under key `access_token`.

| Approach | Pros | Cons |
|----------|------|------|
| **`sessionStorage` (chosen)** | Survives page refresh within tab; simple with stateless JWT | Readable by any same-origin script — **XSS = token theft** |
| In-memory only | Smallest XSS window | Lost on refresh — poor UX for learning app |
| **httpOnly cookie** | Not readable from JS — better XSS resistance | Requires cookie CSRF strategy, SameSite policy, server logout semantics — **deferred to a future auth epic** |

**Why not httpOnly cookies in v1:** this project teaches JWT + Bearer headers first. Cookie-based sessions are a valid production pattern but add CSRF and deployment complexity out of scope for authn v1.

**Mitigation today:** no `dangerouslySetInnerHTML`, minimal third-party scripts, dependency updates, and awareness that **any XSS bug is a session compromise**.

---

## 5. Same-origin & CORS

**There is no CORS middleware** on the FastAPI app — by design.

| Environment | How browser and API share an origin |
|-------------|-------------------------------------|
| **Local dev** | Vite dev server (`:5173`) proxies `/notes`, `/auth`, `/health` → Uvicorn (`:8000`) — browser sees one origin |
| **Preview / Docker prod** | nginx serves React `dist/` and reverse-proxies API paths on the **same host** |

Because the SPA never calls a different origin for API requests, **CORS preflight is unnecessary**. Adding `CORSMiddleware` would only matter if the UI were hosted on a separate domain without a reverse proxy — not the architecture chosen here.

**Deployment detail:** [ADR-004 — CI/CD and preview deployment](../_bmad-output/planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md)

---

## 6. Cookies

**Auth does not use cookies.** Login returns JSON with `access_token`; the client stores it in `sessionStorage` and sends `Authorization: Bearer` on subsequent requests.

No `Set-Cookie` for sessions, no refresh-token cookies, no "remember me" persistence across browser restarts (tab `sessionStorage` clears when the tab closes).

---

## 7. Secrets & environment variables

| Variable | Purpose | Commit to git? |
|----------|---------|--------------|
| `SECRET_KEY` | JWT signing key | **Never** — `.env` only |
| `INITIAL_ADMIN_PASSWORD` | Bootstrap `admin` user in migration `003` | **Never** |
| `DATABASE_URL` | Postgres on preview; SQLite locally | **Never** (Neon URL is a secret) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL (default 60) | OK in `.env.example` as documentation |

`.env` is gitignored. `.env.example` holds placeholders only. Alembic migrations do **not** auto-load `.env` — export `INITIAL_ADMIN_PASSWORD` before `alembic upgrade head`.

---

## 8. Production startup guards

When `ENVIRONMENT` or `ENV` is `production` / `prod`:

1. **`SECRET_KEY`** must be set (unset = fail fast at startup; whitespace-only is treated as set — use a non-empty secret).
2. **`DATABASE_URL`** must point at **Postgres** — SQLite URLs are rejected (`validate_production_database_url()` in `app/database.py`).

These guards prevent accidentally running the preview configuration with dev defaults. Render startup runs `alembic upgrade head` then serves via nginx + Uvicorn.

---

## 9. Security headers — documented deferral

The nginx template ([`deploy/nginx.conf.template`](../deploy/nginx.conf.template)) proxies API routes and serves static files. It does **not** add hardening response headers.

**Not set in v1:**

| Header | Typical purpose | Why deferred |
|--------|-----------------|--------------|
| **Content-Security-Policy (CSP)** | Restrict script/style sources | Requires coordinated nonce/hash strategy with Vite dev workflow and `/docs` Swagger — non-trivial for this stack |
| **Strict-Transport-Security (HSTS)** | Force HTTPS | Render provides HTTPS termination; explicit HSTS header not configured in nginx template yet |
| **X-Frame-Options** | Clickjacking protection | Not added in current nginx config |
| **X-Content-Type-Options** | MIME sniffing protection | Not added in current nginx config |

**Rationale:** preview is a **learning deployment** with **same-origin** architecture and **no real users**. Documenting the gap is more honest than claiming headers exist. Before a real production launch, add baseline nginx headers, HSTS via platform settings, and a CSP policy draft tested against the SPA build.

**Future work:** separate infra epic — not Visible Quality Phase 2 (narrative only).

---

## 10. Related quality & testing evidence

| Topic | Document |
|-------|----------|
| Test coverage policy (≥85% backend, e2e critical paths) | [ADR-010](../_bmad-output/planning-artifacts/adr/adr-010-test-coverage-and-quality-policy.md) |
| Accessibility baseline (axe, focus rings) | [frontend/docs/accessibility.md](../frontend/docs/accessibility.md) · [ADR-011 Phase 1](../_bmad-output/planning-artifacts/adr/adr-011-visible-quality-phase1.md) |
| System architecture diagram | [docs/architecture.md](architecture.md) |

---

## 11. Out of scope / backlog

Explicitly **not** implemented in v1 — do not assume these exist:

- Rate limiting on `/auth/login` or public preview
- RBAC, `owner_id` on notes, 403 role checks
- Refresh tokens and token rotation
- JWT denylist / server-side logout
- CORS middleware (unless split-origin hosting is adopted)
- Security headers in nginx (see §9)
- `POST /auth/register` — bootstrap `admin` only via migration

Track deferred infra and quality slices in [`deferred-work.md`](../_bmad-output/implementation-artifacts/deferred-work.md).

---

## Further reading

- [ADR-003 — Stateless JWT authentication](../_bmad-output/planning-artifacts/adr/adr-003-stateless-jwt-authentication.md)
- [ADR-004 — CI/CD and preview deployment](../_bmad-output/planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md)
- [ADR-010 — Test coverage and quality policy](../_bmad-output/planning-artifacts/adr/adr-010-test-coverage-and-quality-policy.md)
- [ADR-011 — Visible Quality Phase 1](../_bmad-output/planning-artifacts/adr/adr-011-visible-quality-phase1.md)
- [ADR-012 — Visible Quality Phase 2](../_bmad-output/planning-artifacts/adr/adr-012-visible-quality-phase2.md)
