# ADR-006: Application versioning and visibility

**Status:** Accepted — **implemented**  
**Date:** 2026-06-04  
**Revised:** 2026-06-04 (scope simplified: `/health` only, root `VERSION`, no git SHA in v1); 2026-06-04 (validation: `0.x` semver policy, Docker `COPY VERSION`, CI E2E with API)  
**Scope:** Single product version (semver) for end users; in-app display, `GET /health`, and release notes. Coupled monorepo deploy (one Docker image per ADR-004) remains the assumption.  
**Related:** ADR-004 (CI/CD, multi-stage Docker), ADR-003 (`/health` smoke), `app/main.py` (`version="0.4.0"`), `frontend/package.json` (`0.0.0`).  
**Discussion:** BMAD party mode 2026-06-04 (Winston, Amelia, John, Sally). User goal: version visible in the web UI because multi-stage builds make it unclear what is running on preview/prod.

## Context

Today version information is fragmented and not visible to users:

| Location | Current value | Problem |
|----------|---------------|---------|
| `app/main.py` (`FastAPI.version`) | `0.4.0` | Hardcoded; OpenAPI/docs only |
| `frontend/package.json` | `0.0.0` | Not synced; not shown in UI |
| `GET /health` | `{"status":"ok"}` | No product version (Render/nginx smoke uses this path) |
| Web UI | — | No footer or About line |

The team agreed that **end users** need one understandable product version and optional “what’s new” text. Split **application / backend / frontend** semver with a living compatibility matrix was **rejected for now** because frontend and API always ship together in one image (ADR-004); independent version lines would drift without matching independent release channels.

**Git commit SHA in UI or `/health` (v1):** deferred to keep the first delivery small. When semver is unchanged across redeploys, ops can still use the hosting dashboard (Render commit, GitHub Actions run) until SHA metadata is reconsidered.

## Decision

| Area | Choice |
|------|--------|
| **Product version** | **One semver** for the whole application (e.g. `0.4.0`). **Canonical source:** root **`VERSION`** file (plain text, one line, no `v` prefix). Consumed by FastAPI, UI label, `package.json` mirror, CHANGELOG, and Docker/Vite build input. |
| **Backend / frontend semver** | **Not separate product versions.** Release notes may use sections (API, UI, Infra); bump only the product version. |
| **Compatibility matrix** | **Deferred.** When deploy is coupled, document **policy** only (`docs/releases/compatibility.md`: no partial upgrades, one image = one release). Add a version matrix only if FE and API deploy separately or external API clients appear. |
| **Build metadata (git SHA, `built_at`)** | **Out of scope for v1.** Revisit in a follow-up ADR amendment if deploy traceability beyond semver is still needed. |
| **Release notes** | Root **`CHANGELOG.md`** ([Keep a Changelog](https://keepachangelog.com/)). User-facing summary can mirror the release section; long migration notes in `docs/releases/<version>.md` when needed. |
| **API exposure** | Extend **`GET /health` only** (no `GET /version`). Response: `status: ok` (required for probes) plus **`version`** (product semver string from root `VERSION`). Additive fields; smoke checks must still pass when only `status` is asserted. |
| **UI exposure** | **`BuildInfo` in page footer** on login and Notes home; label **`v{semver}`** only (from build-time `VITE_APP_VERSION`, sourced from root `VERSION`). |
| **Build injection** | Docker **build-arg** `APP_VERSION` (and `VITE_APP_VERSION` for the frontend stage) read from root `VERSION` at image build. **One value** for frontend stage and API runtime. API image **`COPY VERSION`** into `/app/VERSION` for runtime reads. Local dev: Vite reads root `VERSION` (e.g. `vite.config.ts` `define`) or synced `package.json` / `.env.development` default. |
| **Runtime version resolution** | `app/version.py` `get_product_version()`: **`APP_VERSION` env** (set from build-arg in Docker) if present, else read trimmed root **`VERSION`** file (path via repo root relative to `app/`, works locally and in container when file is copied). |
| **E2E (CI)** | Extend GitHub Actions **e2e** job to run **Uvicorn + migrations** alongside Vite (Playwright `webServer` or parallel step) so post-login `notes-app` assertions can call `POST /auth/login`. Use seeded `admin` + `INITIAL_ADMIN_PASSWORD` from CI env (same pattern as backend tests). Login-only `build-info` checks do not require API; **notes-app footer requires API in CI**. |
| **OpenAPI** | `info.version` = product version (from root `VERSION`, not duplicate literals in `main.py`). |

### Rationale

- **One semver** matches one deployable unit (ADR-004) and avoids user confusion (“API 0.9 vs app 1.4”).
- **Root `VERSION`** is a single bump point; `app/version.py` resolves it (env in Docker, file locally) — not a second canonical semver source.
- **`/health` + footer** give users and ops the product release without a second endpoint or commit metadata in v1.
- **CHANGELOG** gives humans breaking changes and dependencies without a second versioning scheme.
- **Baked-in UI metadata** (`VITE_APP_VERSION`) matches the built bundle; **`/health.version`** supports `curl` and aligns API with UI when both are built from the same `VERSION` in one image build.

### Rejected (for current architecture)

| Proposal | Reason |
|----------|--------|
| Independent app / backend / frontend semver | Coupled Docker deploy; high sync cost; matrix rots |
| `frontend/package.json` as version source of truth | Should **mirror** root `VERSION`, not lead |
| `GET /version` separate endpoint | v1 uses **`GET /health` only** |
| `git_sha` / `built_at` in UI or `/health` (v1) | Scope cut; add later if semver-only is insufficient |
| User-facing compatibility matrix | Wrong audience; use CHANGELOG + support runbook |
| Runtime-only version from API without build inject | Hides which UI bundle is loaded; multi-stage ambiguity remains |

## Version semantics

Product is **pre-1.0** (`0.y.z`). Until `1.0.0`:

- **MINOR (`y`):** breaking API or user-visible contract change (e.g. ADR-003 Bearer on all `/notes` shipped as **`0.4.0`**, not `1.0.0`).
- **PATCH (`z`):** backward-compatible features **or** bugfixes with no contract change.

At **`1.0.0` and above**, switch to standard semver:

- **MAJOR:** breaking API or user-visible contract change.
- **MINOR:** backward-compatible features.
- **PATCH:** bugfixes, no contract change.

Document the `0.x` → `1.0.0` cutover in `CHANGELOG.md` when the first stable release is declared.

## UI requirements (v1)

End users must see **which product release** is running without opening API docs, settings, or `curl`.

### 1. What the user sees

- **Format:** `v{semver}` — e.g. `v0.4.0`, where `semver` is the contents of root `VERSION`.
- **One product version number** in the UI. Do **not** show separate “API version” vs “app version” labels.
- **No git SHA** in the footer for v1.

### 2. Placement — footer only

- **Fixed placement:** bottom **page footer** inside the full-height shell (`min-h-screen` layout), not in the header next to “Notes” / “Sign in”.
- **Layout:** use a column flex shell so the footer sits at the viewport bottom (e.g. outer `flex min-h-screen flex-col`, main `flex-1`, then `<footer>` with `BuildInfo`).
- **Screens (both required):**
  - **Unauthenticated entry:** login view (`LoginForm` / `data-testid="login-app"`).
  - **Authenticated home:** Notes layout (`App.tsx` / `data-testid="notes-app"`).
- **Component:** `frontend/src/components/BuildInfo.tsx`, rendered once per screen at the foot of the page (e.g. `<footer>` with `data-testid="build-info"`).

### 3. Automated checks (E2E)

Add to existing Playwright suite (`frontend/e2e/`):

- On **login:** `build-info` visible; text matches `/v\d+\.\d+\.\d+/` (semver from `VITE_APP_VERSION` or dev default aligned with root `VERSION`). **No API required** (Vite-only `webServer` is enough).
- After **sign-in:** log in as seeded `admin` (password from `INITIAL_ADMIN_PASSWORD` in CI / local `.env`); `build-info` visible on `notes-app` with the same semver pattern.

**CI (ADR-004 alignment):** today’s e2e job runs Vite only and does not start Uvicorn. Implementing the post-login assertion **requires** extending CI so the API is reachable on port 8000 during Playwright (e.g. second `webServer` entry, or a wrapper script that starts `alembic upgrade head` + `uvicorn` before `npm run dev`). Do **not** leave notes-app footer coverage local-only while login footer runs in CI — both screens are required in the same suite per this ADR.

### 4. Delivery model — all phases together (preferred)

**Team choice:** ship **Phases 1–4 in one implementation** (one story or PR). Do not treat Phase 3 as a standalone release with hardcoded semver and wire API/Docker later.

| Phase | What it contributes to the whole |
|-------|----------------------------------|
| **1** | Root `VERSION` → same semver in FastAPI, `package.json`, CHANGELOG |
| **2** | `version` on `GET /health` + tests + `project-context` / README |
| **3** | Footer on login + Notes (`BuildInfo`) + Playwright — **what the user sees** |
| **4** | Docker/CI passes `APP_VERSION` / `VITE_APP_VERSION` from root `VERSION` in one image build |

**Technical note:** the footer reads **build-time** `VITE_APP_VERSION`, not `/health` at runtime. Phase 4 ensures preview/prod images bake the same semver as the API; Phase 1 must exist so UI and API never disagree. Partial delivery (footer only, no `VERSION` file, no Docker arg) is **out of scope** for v1.

**Done when (acceptance for the full ADR v1):**

- [x] Root `VERSION`; `app/main.py` and `frontend/package.json` match it
- [x] `CHANGELOG.md` + `docs/releases/compatibility.md`
- [x] `GET /health` returns `status` and `version`; `test_health` asserts required keys (not full-body equality to `{"status":"ok"}` only)
- [x] `_bmad-output/project-context.md` **verified** for additive `version` on `/health` (rule may already exist; align wording with implementation)
- [x] Footer on login and Notes; E2E asserts semver visible on **both** screens in **CI** (API + Vite for post-login)
- [x] `Dockerfile` **`COPY VERSION`**, build-args `APP_VERSION` / `VITE_APP_VERSION`; CI/Render pass version from `VERSION` when building the image
- [x] README documents: UI footer, `curl /health`, how to bump `VERSION`

**Suggested order inside the same PR:** Phase 1 → 2 → 3 → 4 (linear).

## Implementation plan (phased)

### Phase 1 — Canonical version and docs

- Add root **`VERSION`** (e.g. `0.4.0`) — **only** manual bump point.
- Add `app/version.py` with `get_product_version()` per **Runtime version resolution** (env `APP_VERSION` else root `VERSION` file); wire `app/main.py` `FastAPI(version=...)`.
- Sync `frontend/package.json` `version` field to the same value (mirror, not source of truth).
- Add `CHANGELOG.md` with `[Unreleased]` and current release section for `0.4.0`.
- Add `docs/releases/compatibility.md` (policy: coupled deploy, no partial upgrades).

### Phase 2 — API and tests

- Extend `GET /health` to return `{"status": "ok", "version": "<from VERSION>"}`.
- Update `tests/test_notes.py::test_health` to assert `status` and `version` (subset / required keys).
- **Verify** `_bmad-output/project-context.md` health rule matches ADR-006 (additive `version`; no strict body equality in tests).
- Update `spec-notes-api-fastapi-learning.md` `/health` example if still `{"status":"ok"}` only.
- Document in `README.md` where to read version (UI + `curl /health`).

### Phase 3 — UI

- Vite: `VITE_APP_VERSION` at build from root `VERSION` via `vite.config.ts` (e.g. read `../VERSION` into `define` / `env`); document local fallback in README.
- `BuildInfo.tsx`: footer on **login** and **Notes home** per **UI requirements (v1)** §1–2 (flex column layout per §2).
- Playwright assertions per **UI requirements (v1)** §3; extend **`.github/workflows/ci.yml` e2e** so Uvicorn + DB are up for post-login test.

### Phase 4 — Docker and CI

- `Dockerfile`: `ARG APP_VERSION` defaulting from build context; pass as `ENV` to API runtime and as `VITE_APP_VERSION` on `frontend-build`; **`COPY VERSION`** into API image at `/app/VERSION`.
- `docker build` / Render: set build-args from root `VERSION` file contents (same value for both stages).
- GitHub Actions: frontend `npm run build` in CI may read `VERSION` for parity (optional check that `package.json` version matches).

**Out of scope for v1:** git SHA / `built_at` in UI or API, environment badge in footer, semver automation from git tags, in-app CHANGELOG modal, OpenAPI `apiVersion` header, mismatch warning UI, `GET /version`, Neon/Phase 3 deploy changes.

## Consequences

### Positive

- Users see a stable product version; ops can read the same semver via `curl /health`.
- Release discipline via CHANGELOG without maintaining three version numbers.
- Aligns with ADR-004 single-artifact mental model; smaller first delivery than SHA + timestamps.

### Negative / trade-offs

- Manual version bump until tag automation is added.
- Same semver on redeploy does not identify **which commit** is running (SHA deferred).
- Extending `/health` requires updating strict equality tests and `project-context.md` — **resolved in this ADR** (additive `version` field).

## References

- Party mode consensus: one product version + CHANGELOG; matrix deferred.
- `_bmad-output/project-context.md` — verify `/health` and product version notes when Phase 2 lands (forward-looking rules may already reference ADR-006).
- Implementation checklist can live in `_bmad-output/implementation-artifacts/plan-app-versioning-phases.md` (optional follow-up).

## Implementation status

**Delivery:** Phases **1–4 together** — complete (2026-06-04).

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Root `VERSION` + CHANGELOG + policy doc | **Done** | `VERSION`, `CHANGELOG.md`, `docs/releases/compatibility.md`, `app/version.py` |
| 2 — API `/health` + tests + project-context | **Done** | `status` + `version`; `test_health` asserts keys |
| 3 — UI BuildInfo + login + E2E | **Done** | Footer on login + Notes; CI e2e runs API + Vite |
| 4 — Docker/CI version build-arg | **Done** | `COPY VERSION` + `APP_VERSION` / `VITE_APP_VERSION` build-args |

**v1 is complete only when all four rows are done** (see UI requirements §4 checklist).
