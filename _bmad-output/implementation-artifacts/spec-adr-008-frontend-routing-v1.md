---
title: 'ADR-008 Frontend Routing v1'
type: 'feature'
created: '2026-06-05'
status: 'done'
baseline_commit: '05119e97f0e9fc97b85548129279ec2c88a4f18d'
context:
  - '{project-root}/_bmad-output/planning-artifacts/adr/adr-008-frontend-routing-v1.md'
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Notes SPA is a single-page monolith (`App.tsx` owns auth, list, editor, and session shells on `/`). There is no URL-driven navigation, no shareable note links, and no separation of dashboard/settings from CRUD work.

**Approach:** Add `react-router-dom` v6 and split the app into five routes with `ProtectedRoute`, `AppLayout`, and page components. Extend ADR-007 Query patterns (hooks, keys, optimistic CRUD, prefetch) — do not replace them. Post-login home is `/dashboard`; notes CRUD moves to `/notes` and `/notes/:id`.

## Boundaries & Constraints

**Always:** Keep `main.tsx` as `QueryClientProvider` only. Reuse existing `api/`, `hooks/useAuth.ts`, `hooks/useNotes.ts`, `LoginForm`, `NoteList`, `NoteForm`, `ConfirmDialog`, `BuildInfo`. Session phases from ADR-007 unchanged (resolving/error shells, no login flash on refresh). Form state stays page-local `useState`. Logout clears `authKeys.all`, `notesKeys.all`, and `healthKeys.all`. Component-driven data fetching only — no `createBrowserRouter` loaders.

**Ask First:** Adding routes beyond the ADR-008 table; changing post-login landing away from `/dashboard`; backend API changes.

**Never:** TanStack Router; Zustand/Redux; `/notes/new` route; `returnUrl`/`?next=` redirect; search/sort query params; `createBrowserRouter` loaders; full Playwright CRUD matrix rewrite (update smoke only per `deferred-work.md`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login success | Valid credentials on `/login` | Navigate `/dashboard` with `replace` | Show alert on 401/network error |
| Root redirect | `GET /` with/without token | Authenticated → `/dashboard`; else → `/login` | N/A |
| Protected without token | Direct `/notes` or `/dashboard` | `Navigate` to `/login` | N/A |
| Session resolving | Token + `useMeQuery` pending | Full-screen "Checking session…" in `ProtectedRoute` | No login flash |
| Session error | Token + non-401 `useMeQuery` error | Error shell with Retry + Sign out | Retry refetches; sign out → `/login` |
| Create note | Submit on `/notes` | `POST /notes` → navigate `/notes/:id` | Field/global errors inline |
| List → detail | Click note row | Navigate `/notes/:id` | Ignore `id <= 0` (optimistic) |
| Delete detail | Confirm delete on `/notes/:id` | `DELETE` → navigate `/notes` | Error alert on failure |
| Invalid note id | `/notes/abc` or missing note | Inline error or `Navigate` to `/notes` | N/A |
| Scroll restore | Back from `/notes/:id` to `/notes` | List scroll Y restored from `sessionStorage` | N/A if no saved position |
| Logout | Header or settings | Clear token + cache → `/login` | N/A |
| Dashboard empty | Zero notes | «Заметок пока нет» + CTA → `/notes` | N/A |

</frozen-after-approval>

## Code Map

- `frontend/package.json` — add `react-router-dom` dependency
- `frontend/vite.config.ts` — add `/health` dev proxy (missing today)
- `frontend/src/App.tsx` — shrink to `BrowserRouter` + root redirect + session shells + `Routes`
- `frontend/src/main.tsx` — unchanged (`QueryClientProvider` wrapper)
- `frontend/src/api/health.ts` — NEW: `getHealth()` → `GET /health`
- `frontend/src/query/keys.ts` — add `healthKeys`
- `frontend/src/hooks/useHealth.ts` — NEW: `useHealthQuery`
- `frontend/src/components/ProtectedRoute.tsx` — NEW: auth guard + session shells
- `frontend/src/layouts/AppLayout.tsx` — NEW: nav, breadcrumbs slot, `Outlet`, footer
- `frontend/src/components/AppNav.tsx` — NEW: Dashboard/Notes/Settings links + Logout
- `frontend/src/components/Breadcrumbs.tsx` — NEW: detail-only `Notes > {title}`
- `frontend/src/pages/LoginPage.tsx` — NEW: wraps `LoginForm`, navigate on success
- `frontend/src/pages/DashboardPage.tsx` — NEW: greeting, stats, health, quick links
- `frontend/src/pages/NotesListPage.tsx` — NEW: list + create form (extract from `App.tsx`)
- `frontend/src/pages/NoteDetailPage.tsx` — NEW: edit/delete via `useParams` + `useNoteQuery`
- `frontend/src/pages/SettingsPage.tsx` — NEW: username + logout
- `frontend/src/components/NoteList.tsx` — change `onSelect` to navigate (or page handles)
- `frontend/e2e/session.spec.ts` — post-login `/dashboard`, `dashboard-app` testid
- `frontend/e2e/helpers/auth.ts` — `signIn` waits for dashboard
- `frontend/e2e/notes-crud.spec.ts` — adapt navigation for split list/detail routes
- `README.md` — frontend section: routes, dev URLs, proxy paths

## Tasks & Acceptance

**Execution:**
- [x] `frontend/package.json` -- install `react-router-dom` v6 -- routing foundation
- [x] `frontend/vite.config.ts` -- proxy `/health` to port 8000 -- dashboard health fetch in dev
- [x] `frontend/src/api/health.ts` -- add `getHealth()` typed response `{ status, version }` -- dashboard API version
- [x] `frontend/src/query/keys.ts` -- add `healthKeys.all` / `healthKeys.health()` -- cache invalidation on logout
- [x] `frontend/src/hooks/useHealth.ts` -- add `useHealthQuery` -- dashboard data hook
- [x] `frontend/src/components/ProtectedRoute.tsx` -- token guard, resolving/error shells, `Outlet` on success -- ADR-007 session in route context
- [x] `frontend/src/App.tsx` -- `BrowserRouter`, `/` redirect, public `/login`, protected route tree -- composition root only
- [x] `frontend/src/layouts/AppLayout.tsx` -- header nav, breadcrumbs outlet, `Outlet`, `BuildInfo` footer -- shared chrome
- [x] `frontend/src/components/AppNav.tsx` -- nav links + logout handler (clear token, cache, navigate `/login`) -- cross-page navigation
- [x] `frontend/src/pages/LoginPage.tsx` -- `LoginForm` + `navigate('/dashboard')` on success -- public entry
- [x] `frontend/src/pages/DashboardPage.tsx` -- `useMeQuery`, `useNotesQuery`, `useHealthQuery`, empty CTA, `data-testid="dashboard-app"` -- post-login home
- [x] `frontend/src/pages/NotesListPage.tsx` -- extract list + create from `App.tsx`, create → navigate detail, prefetch on hover, `data-testid="notes-app"` -- list CRUD
- [x] `frontend/src/pages/NoteDetailPage.tsx` -- `useParams` + `useNoteQuery`, edit/delete, breadcrumbs, `data-testid="note-detail-app"` -- dynamic route
- [x] `frontend/src/components/Breadcrumbs.tsx` -- `Notes > {title}` on detail only -- ADR-008 breadcrumb rule
- [x] `frontend/src/pages/SettingsPage.tsx` -- username display + logout, `data-testid="settings-app"` -- profile page
- [x] `frontend/src/pages/NotesListPage.tsx` -- scroll save/restore via `sessionStorage` key `notes-list-scroll-y` -- back-navigation UX
- [x] `frontend/e2e/session.spec.ts` -- assert `/dashboard` and `dashboard-app` after login; update session recovery paths -- routing smoke
- [x] `frontend/e2e/helpers/auth.ts` -- `signIn` targets dashboard -- shared e2e helper
- [x] `frontend/e2e/notes-crud.spec.ts` -- navigate list ↔ detail for CRUD flows -- prevent regression
- [x] `README.md` -- document route map, `/health` proxy, page layout -- ADR-008 compliance

**Acceptance Criteria:**
- Given no token, when user opens `/dashboard`, then they are redirected to `/login`.
- Given valid login, when sign-in succeeds, then URL is `/dashboard` and `dashboard-app` is visible.
- Given authenticated session, when user creates a note on `/notes`, then they land on `/notes/:id` with the new note.
- Given a note on `/notes/:id`, when user deletes it, then they are on `/notes` with the note removed from list.
- Given user scrolled `/notes` list, when they navigate to detail and press back, then list scroll position is restored.
- Given authenticated session, when user clicks Logout, then they are on `/login` with caches cleared.
- Given `npm run lint`, `npm run build`, and Playwright e2e in `frontend/`, when run after implementation, then all pass.

## Spec Change Log

### Loop 1 (review patches)

- **Finding:** Logout/401 did not cancel in-flight queries; scroll saved on every `/notes` leave; LoginPage ignored non-401 session errors.
- **Amended:** `useLogout` + `App.tsx` now `cancelQueries` before `removeQueries`; scroll key set only in `selectNote`; restore after list loads; `LoginPage` shows `SessionErrorShell` on token + error.
- **KEEP:** Route table, page split, ADR-007 session copy, component-driven hooks unchanged.

### Loop 2 (review patches)

- **Finding:** Dashboard masked notes fetch errors as empty state; no catch-all route; duplicated cache-clear logic; scroll restore lacked NaN guard.
- **Amended:** `DashboardPage` shows notes error alert; `App.tsx` adds `path="*"` redirect; shared `clearSessionCaches` in `query/session.ts`; scroll restore validates `Number.isFinite(y)`.
- **KEEP:** Defer items (scroll e2e, ADR status table sync, Playwright re-run with API).

### Loop 3 (re-review)

- **Finding:** `notes-crud.spec.ts` `goToNotes` uses substring `name: 'Notes'` — matches nav link and dashboard «View all notes»; Playwright strict mode violation.
- **Verified:** Loop 2 patches hold; session/smoke e2e 8/8 pass with `INITIAL_ADMIN_PASSWORD=admin123`; CRUD 0/4 blocked by selector.
- **Amended (Loop 3 patch):** `goToNotes` scopes to `header` nav link + `exact: true` (avoids dashboard «View all notes» and breadcrumb «Notes»).

## Design Notes

**Logout cache wipe** — extend existing `resetAuthSession` pattern: `queryClient.removeQueries({ queryKey: healthKeys.all })` alongside auth/notes keys; always `navigate('/login', { replace: true })`.

**Scroll restoration** — on `NotesListPage` unmount (or `useEffect` cleanup when leaving `/notes`), save `window.scrollY` to `sessionStorage`; on mount, `requestAnimationFrame` scroll to saved Y then remove key. Do not restore when arriving from dashboard CTA (no saved key).

**NoteList navigation** — replace `selectedId` highlight with optional `activeId` from `useParams` on detail route; list page passes `navigate(`/notes/${id}`)` instead of `setEditingId`.

## Verification

**Commands:**
- `cd frontend && npm run lint` -- expected: zero errors
- `cd frontend && npm run build` -- expected: production build succeeds
- `cd frontend && npx playwright test` -- expected: all e2e specs pass (API on :8000)

**Manual checks:**
- Direct URL `/notes/1` with valid session loads detail with breadcrumbs
- Refresh on `/dashboard` shows resolving shell briefly, not login flash

## Suggested Review Order

**Router shell & auth**

- Composition root: BrowserRouter, route tree, 401 → login redirect
  [`App.tsx:1`](../../frontend/src/App.tsx#L1)

- Token guard with ADR-007 session phases (resolving / error / outlet)
  [`ProtectedRoute.tsx:1`](../../frontend/src/components/ProtectedRoute.tsx#L1)

- Public entry: no login flash, session error on stale token
  [`LoginPage.tsx:1`](../../frontend/src/pages/LoginPage.tsx#L1)

- Shared logout: cancel + remove all query caches
  [`useLogout.ts:1`](../../frontend/src/hooks/useLogout.ts#L1)

**Pages & layout**

- Post-login home: multi-query dashboard (me, notes, health)
  [`DashboardPage.tsx:1`](../../frontend/src/pages/DashboardPage.tsx#L1)

- List + create; scroll save only on list→detail navigation
  [`NotesListPage.tsx:1`](../../frontend/src/pages/NotesListPage.tsx#L1)

- Dynamic route: edit/delete, breadcrumbs, keyed editor remount
  [`NoteDetailPage.tsx:1`](../../frontend/src/pages/NoteDetailPage.tsx#L1)

- Nav chrome: Dashboard / Notes / Settings links
  [`AppLayout.tsx:1`](../../frontend/src/layouts/AppLayout.tsx#L1)

**Data layer**

- Health API client + query key for dashboard version
  [`health.ts:1`](../../frontend/src/api/health.ts#L1)

- Dev proxy for `/health` alongside notes/auth
  [`vite.config.ts:43`](../../frontend/vite.config.ts#L43)

**Tests & docs**

- E2E: sign-in lands on `/dashboard`, CRUD across list/detail routes
  [`session.spec.ts:1`](../../frontend/e2e/session.spec.ts#L1)

- README route table and updated project layout
  [`README.md:59`](../../README.md#L59)

### Review Findings

- [x] [Review][Patch] Dashboard masks notes fetch failure as empty state [`frontend/src/pages/DashboardPage.tsx:32`]
- [x] [Review][Patch] No catch-all route — unknown paths render blank [`frontend/src/App.tsx:46`]
- [x] [Review][Patch] Duplicated query-cache reset in App.tsx and useLogout [`frontend/src/query/session.ts`]
- [x] [Review][Patch] Scroll restore does not guard against corrupt sessionStorage value [`frontend/src/pages/NotesListPage.tsx:55`]
- [x] [Review][Defer] Scroll restoration AC has no e2e coverage — deferred, spec defers full matrix
- [x] [Review][Defer] ADR planning doc implementation-status table still shows Pending — deferred, docs sync
- [x] [Review][Defer] AC7 Playwright pass not verified in review (API :8000 down) — deferred, re-run with uvicorn
- [x] [Review][Patch] `goToNotes` strict-mode violation — `name: 'Notes'` matches «View all notes» [`frontend/e2e/notes-crud.spec.ts:17`]
