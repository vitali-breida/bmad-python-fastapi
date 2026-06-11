---
project_name: 'bmad-python-fastapi'
user_name: 'Vitali'
date: '2026-05-21'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - auth_rules
  - frontend_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
status: complete
rule_count: 74
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Python 3.11+ | Modern typing (`list[T]`, `T \| None`) |
| API | FastAPI 0.136.x | Sync endpoints; `TestClient` for tests |
| Server | Uvicorn 0.47.x | **Single worker** with file SQLite |
| Validation | Pydantic v2 | API schemas in `app/models.py` only |
| ORM | SQLAlchemy 2.0 sync | Declarative `Mapped` in `app/db_models.py` |
| Migrations | Alembic 1.18.x | Readable revision ids (`001_baseline_notes` → … → `003_add_users_table`) |
| DB | SQLite (local/CI) · Neon Postgres (preview) | Default `sqlite:///./notes.db`; preview `DATABASE_URL` → Neon; production guard rejects missing/SQLite URL when `ENVIRONMENT=production` |
| Auth | Stateless JWT (HS256) + `pwdlib[bcrypt]` | ADR-003; `PyJWT`, `python-multipart` (login form), `python-dotenv` (loads `.env` on API import) |
| Tests (API) | pytest 8.x + httpx | In-memory DB; override `get_db` and often `get_current_user` |
| UI | React 19 + TypeScript 6 + Vite 8 | SPA in `frontend/` |
| UI styling | Tailwind CSS 4 (`@tailwindcss/vite`) | Utility classes; `src/index.css` imports tailwind |
| UI E2E | Playwright 1.60 | Smoke test in `frontend/e2e/`; dev server via `webServer` |

`requirements.txt` uses version ranges; match installed `.venv` versions when pinning or documenting.

---

## Critical Implementation Rules

### Language-Specific Rules

- Use **Python 3.11+** syntax: `list[Note]`, `dict[str, str]`, `Note | None` (not `Optional` unless existing code uses it).
- Keep **Pydantic models** (`app/models.py`) separate from **SQLAlchemy rows** (`app/db_models.py`); map notes in `store._to_note()`, users in `app/auth/users._to_user_read()` (no password in API).
- Field length limits must stay aligned: `title` max 200, `body` max 10_000 in both Pydantic `Field` and SQLAlchemy `String(...)`.
- Partial updates: `NoteUpdate` fields default to `None` meaning “omit”; only apply non-`None` fields in `store.update_note`.
- Set `updated_at` with `datetime.now(UTC)` in `store.update_note` on successful update; leave `NULL` on create.
- Type-checking: `pyrightconfig.json` points at `.venv`; keep imports resolvable from project root.

### Framework-Specific Rules

- **Thin routers** (`app/routers/`): HTTP status, `Depends(get_db)`, `HTTPException`; no SQL in routers.
- **Repository** (`app/store.py`): all CRUD and `db.commit()` / `db.refresh()`; accept `Session` as first arg.
- **Data access (ADR-014):** default **SQLAlchemy ORM** (`select()`, `db.get()`, etc.) in repository modules (`app/store.py`, `app/auth/users.py`). **Exception:** `text()` / Core / raw SQL only when ORM is awkward — **inline comment stating why** (performance or query expressiveness). Never in routers.
- Inject DB via `get_db()` generator in `app/database.py`; never instantiate `SessionLocal()` in routers.
- SQLite engines: always pass `connect_args={"check_same_thread": False}` when URL starts with `sqlite`.
- Routes: `APIRouter(prefix="/notes", tags=["notes"])`; list at `GET ""` (path `/notes`); 404 detail `"Note not found"`; DELETE returns `204` with empty body.
- Do **not** add `create_all` on app startup for schema evolution—use Alembic (`alembic upgrade head`).
- New schema changes: **new Alembic revision**; do not merge baseline + alter into one revision (see ADR-002).
- `alembic/env.py` must use `Base.metadata` from `app.db_models` and `DATABASE_URL` from `app.database`.

### Auth Rules (ADR-003)

- **Layout:** `app/auth/` — `config.py` (env + `load_dotenv` for project-root `.env`), `security.py` (hash/JWT), `users.py` (lookup; **trim username** before query), `deps.py` (`oauth2_scheme`, `get_current_user`).
- **Routers:** `app/routers/auth.py` — `POST /auth/login` (OAuth2 form, needs `python-multipart`), `GET /auth/me`; mount before or alongside notes in `main.py`.
- **Protected routes:** all `/notes/*` require `Depends(get_current_user)`; public: `GET /health`, `POST /auth/login`, `/docs`, `/openapi.json`.
- **User persistence:** `UserRow` in `db_models.py`; user SQL only in `app/auth/users.py` — **not** in `store.py` (notes CRUD only).
- **Login errors:** wrong password, unknown user, inactive user → **401** with same generic message (`Incorrect username or password`); never reveal disabled accounts.
- **`get_current_user`:** verify JWT (`sub`, `exp`), then load `UserRow` by id from DB; bad/non-integer `sub` or missing/inactive user → **401** (never **500**).
- **Secrets:** `SECRET_KEY` required for JWT; loaded from env (`.env` via `python-dotenv` in `app/auth/config.py`). `INITIAL_ADMIN_PASSWORD` required for Alembic `003` seed only — Alembic does **not** auto-load `.env`.
- **Bootstrap:** seed user `admin` in migration `003_add_users_table` (idempotent); no `POST /auth/register` in v1.
- **Product version:** single semver in root **`VERSION`** (ADR-006); `app/version.py` resolves via `APP_VERSION` env or file; OpenAPI `info.version` and `GET /health` include `version`; UI footer shows `v{semver}` via build-time `VITE_APP_VERSION`. Bump only `VERSION` (+ mirror `frontend/package.json`, `CHANGELOG.md`).
- **Out of scope (authn v1):** RBAC/403, `owner_id` on notes, refresh tokens, register endpoint — see authz follow-up ADR.
- **Security narrative (reviewers):** human-readable trade-offs in [`docs/security.md`](../docs/security.md) — JWT, sessionStorage, same-origin, headers deferral; ADR-003 remains canonical for implementation facts.

### Frontend Rules

- **Layout:** `frontend/src/` — `App.tsx` (BrowserRouter + route tree), `pages/` (Login, Dashboard, NotesList, NoteDetail, Settings), `layouts/AppLayout.tsx`, `components/ProtectedRoute.tsx`, `api/`, `hooks/` (`useAuth.ts`, `useNotes.ts`, `useHealth.ts`, `useLogout.ts`), `query/`, `types/`.
- **Routing (ADR-008):** `react-router-dom` v6 — `/login` (public), `/dashboard` (post-login home), `/notes`, `/notes/:id`, `/settings` (protected via `ProtectedRoute` + `AppLayout`). Component-driven data fetching (no route loaders).
- **State:** Server/async data → **TanStack Query** (`authKeys` / `notesKeys` / `healthKeys`, optimistic mutations, prefetch). Form, dialogs → page-local **`useState`** (not in Query cache). Pattern: `pages/` → `hooks/` → `api/` → `query/keys.ts`.
- **API client:** relative paths only (`/notes`, `/auth/login`, `/auth/me`); use `authFetch` in `api/client.ts` for Bearer + 401 → clear token. Login uses plain `fetch` + `application/x-www-form-urlencoded`.
- **Vite proxy:** `vite.config.ts` forwards `/notes`, `/auth`, and `/health` → `http://127.0.0.1:8000`. Do not hardcode `:8000` in TS.
- **Auth UI:** session resolution in `ProtectedRoute` / `LoginPage` from `useMeQuery` (Unauthenticated / Resolving / Authenticated / Session expired / Session check failed); token in `sessionStorage` (`access_token`); login via `useLoginMutation` → navigate `/dashboard`; logout clears storage + `cancelQueries`/`removeQueries` on `authKeys`, `notesKeys`, `healthKeys` → navigate `/login` (silent — no expiry notice). **Session expired** → redirect `/login` with one-shot amber notice (`sessionNotice.ts`, `data-testid="session-expired-notice"`); client-side JWT `exp` check in `token.ts` / `authFetch` / `ProtectedRoute` / `useSessionExpiryGuard`. **Login pending hints** (ADR-007, UI only): while `loginMutation.isPending`, progressive status copy at >2 s / >8 s (`data-testid="login-pending-hint"`); no auth/API changes. Optional hint: username is case-sensitive.
- **Types:** Mirror backend Pydantic schemas in `types/note.ts` — `title` max 200, `body` max 10_000; trim title before create/update.
- **Errors:** Use `ApiError` + `apiErrorFromResponse()` for FastAPI 422 `detail` arrays; map `loc` to `title`/`body` field errors.
- **Components:** Presentational only — props in, callbacks out; no direct `fetch` in components.
- **Styling:** Tailwind utility classes only; no leftover Vite template CSS/assets. **Design tokens (ADR-011):** `@theme` in `frontend/src/index.css` — semantic colors (`surface`, `surface-card`, `surface-muted`, `accent`, `accent-foreground`, `text`, `text-muted`), `rounded-card`, `shadow-card`. Prefer `bg-surface`, `bg-accent`, `text-text-muted` over ad-hoc `gray-*` / `indigo-*` on touched files. Global `:focus-visible` ring in `@layer base`; skip link in `AppLayout` targets `#main-content`.
- **Dev server:** `host: "127.0.0.1"`, `port: 5173`, `strictPort: true`; Playwright `baseURL` / `webServer.url` must use the same host (`127.0.0.1`, not `localhost`).
- **Production:** Static build needs reverse proxy for `/notes` **and** `/auth` (or equivalent); no CORS on API unless explicitly added.
- **Page roles (ADR-009):** Dashboard = **hub** (greeting, tagline, up to 5 recent notes via `sortNotesForDisplay`, single “New note” CTA → `/notes?new=1`, optional “Continue editing” from `sessionStorage` `last-note`). Notes list = **browse** (full-width list, collapsible `ExpandableCreatePanel`; expanded when empty or `?new=1`, collapsed when notes exist). Detail = **only edit surface** (`secondaryLabel="Back to notes"`). Settings = account + collapsible **Developer info** (`useHealthQuery` API version). No health block on Dashboard.
- **Anchor & layer (ADR-013):** On touched screens — **anchor** always visible (greeting + CTA, editor, account card, list header); **layer** one secondary surface on demand (`ExpandableCreatePanel`, detail `SidePanel` for metadata/delete, `CollapsibleSection` for Developer info). Dashboard CTA **above** recent list (1A). Detail: editor in main column; `SidePanel` toggle (`data-testid="note-detail-panel-toggle"`) reveals last updated + delete. Primitives: `CollapsibleSection.tsx`, `SidePanel.tsx` — keyboard + `aria-expanded`, `motion-reduce` safe.
- **Bundle budget (ADR-013):** `npm run check:budget` after `npm run build` — sums gzip of `dist/assets/*.js` vs `package.json` `budgets.totalJsGzipKb` (98 KB cap at v0.4.11). CI `frontend` job runs lint + build + check:budget. See `frontend/docs/performance.md`.
- **Sort:** `frontend/src/utils/notesSort.ts` — `sortNotesForDisplay()` is the single sort source for Dashboard recents and Notes list (`updated_at` desc, null/invalid last, `id` desc tie-break).
- **Toast:** custom `Toast` component (page-local, ~3s auto-dismiss, `data-testid="toast"`). Post-create: navigate to detail with `state: { toast: 'Note created' }`; detail consumes and clears via `replace`. Post-update: “Saved” toast on detail.
- **List delete:** `NoteListItem` overflow menu (⋯) → Delete → `ConfirmDialog`; clear `last-note` on delete when id matches (`frontend/src/utils/lastNote.ts`).
- **Out of scope unless user asks:** global client state library (Redux/Zustand), search/sort query params, `returnUrl` after login. See ADR-008 for routing; ADR-007 for Query patterns; ADR-009 for UX v2.

### Testing Rules

- API tests: `tests/conftest.py` — `sqlite://` + `StaticPool`, `create_all`/`drop_all`, autouse `SECRET_KEY`; **`client`** overrides `get_db` + `get_current_user` (mode A, fast note tests); **`auth_client`** overrides only `get_db` (mode B, real login JWT).
- **`test_user` fixture:** insert known user before login tests; `tests/test_auth.py` for auth integration.
- Teardown: `app.dependency_overrides.clear()` must cover **both** `get_db` and `get_current_user`.
- Never read/write project-root `notes.db` in unit/API tests.
- Migration tests: separate file (`test_migrations.py`); temp file DB + `alembic.command.upgrade`; assert row preservation and nullable `updated_at` after upgrade.
- Assert `updated_at is None` after create, non-null after PUT update.
- Run API tests: `python -m pytest --cov=app --cov-fail-under=85 --cov-report=term-missing` from project root (Coverage policy Rule 1; baseline ~92%).
- Frontend E2E: `cd frontend && npm run test:e2e` — Playwright starts API (`scripts/e2e-api.sh`) + Vite; asserts `build-info` on `/login` and after `admin` sign-in (`dashboard-app`). CI sets `SECRET_KEY` + `INITIAL_ADMIN_PASSWORD` for Alembic seed. **A11y (ADR-011):** `npm run test:a11y` runs axe on `/login`, `/dashboard`, `/notes` (0 critical violations); included in full `test:e2e`. See `frontend/docs/accessibility.md`. **Disclosure (ADR-013):** `e2e/disclosure.spec.ts` — detail side panel toggle + editor visibility.
- Do not commit `frontend/node_modules/`, `frontend/dist/`, `frontend/test-results/`, or `frontend/playwright-report/`.

### Code Quality & Style Rules

- Backend layout: `app/main.py`, `app/routers/` (`notes.py`, `auth.py`), `app/auth/`, `app/store.py`, `app/models.py`, `app/db_models.py`, `app/database.py`, `tests/test_*.py`, `alembic/versions/`.
- Frontend layout: `frontend/src/App.tsx`, `frontend/src/api/` (`auth.ts`, `client.ts`, `notes.ts`, `errors.ts`), `frontend/src/hooks/` (`useAuth.ts`, `useNotes.ts`), `frontend/src/query/` (`client.ts`, `keys.ts`, `errors.ts`), `frontend/src/types/` (`note.ts`, `user.ts`), `frontend/src/components/`, `frontend/e2e/`.
- Naming: `snake_case` modules and functions; ORM class `NoteRow`, API model `Note`; private mapper `_to_note`.
- Minimal comments; code should be self-explanatory; update `README.md` when setup or migration flow changes.
- No production secrets in repo (`.env` gitignored; `.env.example` placeholders only). Rate limiting / CORS for split origins out of scope unless requested.

### Development Workflow Rules

- Local setup (API): venv → `pip install -r requirements.txt` → copy `.env.example` to `.env` → set `INITIAL_ADMIN_PASSWORD` → `alembic upgrade head` → `uvicorn app.main:app --reload` (`.env` loaded via `python-dotenv` in `app/auth/config.py`).
- Local setup (UI): `cd frontend` → `npm install` → `npm run dev` (second terminal; sign in as `admin` with migration password).
- Brownfield DB (pre-Alembic `create_all`): `alembic stamp 001_baseline_notes` then `alembic upgrade head`.
- Brownfield **old revision ids** (`001baseline`, `002updated_at`): update `alembic_version.version_num` to readable ids before `upgrade head` (see README).
- Revision chain: `001_baseline_notes` → `002_add_notes_updated_at` → `003_add_users_table` (revision id = filename stem).
- Out of scope unless user asks: authz/RBAC, PostgreSQL swap (local dev), pagination, multi-worker SQLite, production UI hosting/CORS.
- **CI/CD (ADR-004 — complete):** CI on `main`; preview https://bmad-python-fastapi.onrender.com/ (Neon Postgres, manual Render deploy, v0.4.10 after next deploy). `validate_production_database_url()` fails fast if production uses SQLite or unset URL. Local dev stays SQLite.
- Planning context: ADRs in `_bmad-output/planning-artifacts/adr/` (ADR-003 authn, ADR-004 CI/CD, ADR-005 TanStack Query v1, ADR-006 versioning, ADR-007 TanStack Query v2 patterns, ADR-008 routing, ADR-009 UX v2 — **implemented**; **ADR-010** test coverage policy — **implemented**; **ADR-014** data access ORM-first — **accepted**); specs in `_bmad-output/implementation-artifacts/`.
- **Quality gates (epic DoD):** Every new `spec-*.md` MUST include a `## Quality Gates` section copied from `_bmad-output/implementation-artifacts/quality-gates.md`. Mark all gates `[x]` before epic sign-off. Deferrals → `deferred-work.md`. Retro reference: `epic-9-retro-2026-06-07.md`.
- **Coverage policy (ADR-010):** `_bmad-output/planning-artifacts/adr/adr-010-test-coverage-and-quality-policy.md` (decision); operational checklist in `quality-gates.md` § Coverage policy. Rule 1–2 enforced in CI; Rule 3–4 on epic sign-off. Every spec MUST include `Coverage baseline`, `Test delta (plan/actual)`, and `Coverage after` at close. Baseline 2026-06-10: backend ~92%, pytest 35, e2e 21, critical paths 7/7. ADR-013 delta: +1 e2e file (`disclosure.spec.ts`).
- **UX change order:** user-visible behavior → `bmad-create-ux-design` (full or shortened scope) → ADR → spec (with Quality Gates) → implementation → `bmad-code-review` + automation. P2/P3 backlog items **extend** ADR-008/009; they do not replace routes or page roles.

### Critical Don't-Miss Rules

- **Do not** run multiple Uvicorn workers against one SQLite file (`database is locked`).
- **Do not** put business logic or raw SQL in routers; **do not** use raw SQL in repositories without an ADR-014 **why** comment; **do not** expose `NoteRow` or `hashed_password` in API responses.
- **Do not** put user lookup or password hashing in `store.py`; **do not** skip `python-multipart` when using `OAuth2PasswordRequestForm`.
- **Do not** add `updated_at` on create unless product explicitly requires it (nullable, no backfill per ADR-002).
- **Do not** use async SQLAlchemy/session without a project-wide migration to async endpoints and tests.
- **Do not** rely on `create_all` alone for team schema—always ship an Alembic revision for column/table changes.
- When adding columns: update `db_models.py`, Pydantic `Note` if exposed, `store` mapping, **and** a new migration; keep baseline/alter split for teaching migrations.
- `GET /health` must remain lightweight for smoke checks: **`status: ok` required**; may include additive **`version`** (product semver from root `VERSION`, ADR-006). Probes and tests must not require the body to be exactly `{"status":"ok"}` only.
- **Do not** leave Vite template files (`App.css`, default logos, social icons) in `frontend/src` or `frontend/public`.
- **Do not** add `fetch` calls with absolute API URLs in frontend — rely on proxy (dev) or deployment proxy (prod); protect `/notes` calls must use `authFetch`, not raw `fetch`.
- **Do not** change Playwright host to `localhost` while Vite binds `127.0.0.1` — causes E2E connection failures on some systems.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code.
- Follow ALL rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new patterns emerge.

**For Humans:**

- Keep this file lean and focused on agent needs.
- Update when technology stack or ADRs change.
- Review quarterly for outdated rules.
- Remove rules that become obvious over time.

Last Updated: 2026-06-11
