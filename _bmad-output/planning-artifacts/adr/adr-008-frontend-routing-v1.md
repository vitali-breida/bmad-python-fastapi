# ADR-008: Frontend routing v1 — multi-page SPA

**Status:** Accepted — **v1 implemented** (2026-06-07)  
**Date:** 2026-06-05  
**Scope:** `frontend/` Notes SPA — introduce URL-driven navigation with React Router. Split monolithic `App.tsx` into pages, layout, and protected routes. No backend API changes required for v1.  
**Related:** ADR-007 (TanStack Query v2 — complete), ADR-005 (Query baseline), ADR-003 (JWT, `GET /auth/me`), ADR-006 (version visibility), `../brainstorming/brainstorming-session-2026-06-05-1657.md`, `../../implementation-artifacts/plan-tanstack-query-phases.md`.  
**Supersedes (partial):** ADR-007 out-of-scope items “React Router”, “URL-driven navigation”, and “prefetch tied to route transitions”. ADR-007 session-resolution UI in `App.tsx` is **replaced** by route-based auth shell (see § Session and routing).

## Context

ADR-007 completed TanStack Query v2 on a **single-page** Notes SPA: `useMeQuery`, hierarchical keys, optimistic CRUD, prefetch on list hover, `editingId` + form state in `App.tsx`. The app has **no** `react-router-dom` dependency; login and notes share one URL (`/`).

The learning goal for v1 routing is to **practice multi-page SPA architecture** on the existing stack:

- static, dynamic, and protected routes
- layout with shared navigation
- non-CRUD pages (dashboard, settings) alongside notes CRUD
- visible layering: route → page → hook → `api/` → backend

Brainstorming session 2026-06-05 agreed a concrete v1 shape: five routes, dashboard as post-login home, settings as profile-only page, breadcrumbs on note detail only. Priority is **architectural clarity**, not UI polish.

**Backend already available for new UI (no changes required):**

| Endpoint | Purpose |
|----------|---------|
| `GET /auth/me` | Dashboard greeting, settings username |
| `GET /notes`, `GET /notes/{id}` | List, detail, dashboard stats |
| `GET /health` | Dashboard API version (`status`, `version`) |

**Out of scope for v1:**

- Backend changes (tags, pinned notes, search API, new fields)
- `/notes/new` as a dedicated route (create stays on `/notes`)
- Query params for search/sort (`/notes?search=`) — backlog v2
- `returnUrl` / `?next=` after login redirect — backlog v2
- React Router data APIs (`createBrowserRouter` loaders) — keep v1 on component-driven data fetching via existing hooks
- TanStack Router (different library; deferred)
- Global client store (Zustand/Redux)
- Full Playwright CRUD matrix (update smoke for routing; full matrix remains deferred per `deferred-work.md`)
- Autosave, undo delete, conflict UI
- `persistQueryClient`, WebSocket, infinite query

## Decision

| Area | Choice |
|------|--------|
| **Relationship to ADR-007** | **Extend**, do not replace. Keep `api/`, `query/`, `hooks/`, key hierarchy, optimistic mutations, prefetch, sessionStorage token, `authFetch` 401 handling. |
| **Router library** | **`react-router-dom` v6** — `BrowserRouter`, `Routes`, `Route`, `Navigate`, `useNavigate`, `useParams`, `useLocation`, `Outlet`. |
| **Entry shell** | `main.tsx`: `QueryClientProvider` unchanged. `App.tsx` becomes **router + session shell** only (no notes UI). |
| **Route map (v1)** | See § Route table. |
| **Post-login landing** | **`/dashboard`**, not `/notes`. |
| **Root `/`** | `Navigate` → `/dashboard` when session authenticated; → `/login` when not. |
| **Public routes** | `/login` only. |
| **Protected routes** | `/dashboard`, `/notes`, `/notes/:id`, `/settings` — wrapped in `ProtectedRoute` inside `AppLayout`. |
| **Auth guard** | **`ProtectedRoute`**: no token → `Navigate` to `/login` with `replace`. Token + `useMeQuery` pending → session resolving UI (same copy as ADR-007). Token + `useMeQuery` error (non-401) → session error UI with Retry. Success → render `Outlet` / children. |
| **Login page** | `LoginPage` at `/login`. On success → `navigate('/dashboard', { replace: true })`. Unauthenticated users hitting protected URLs → `/login` (no `next` param in v1). |
| **Layout** | **`AppLayout`**: header with nav links (`Dashboard`, `Notes`, `Settings`), `Logout`, optional breadcrumbs slot, `<Outlet />`, footer `BuildInfo`. Not used on `/login` or global session shells. |
| **Breadcrumbs** | Only on **`/notes/:id`**: `Notes > {note.title}`. `Notes` links to `/notes`. Not on dashboard or settings. |
| **Notes list** | **`NotesListPage`** at `/notes`: list + inline create form (same behaviour as today’s “new note” on single page). No `editingId` route — selection navigates to detail. |
| **Note detail** | **`NoteDetailPage`** at `/notes/:id`: `id` from `useParams()`, `useNoteQuery(id)`, local form `useState` for edit. Invalid/missing id → inline error or `Navigate` to `/notes`. After successful **create** on list page → `navigate(`/notes/${created.id}`)`. |
| **Dashboard** | **`DashboardPage`** at `/dashboard`: greeting (`useMeQuery`), note count + latest note (`useNotesQuery`), API version (`useHealthQuery` — new), quick links. Empty state: «Заметок пока нет» + CTA → `navigate('/notes')` (create on list). |
| **Settings** | **`SettingsPage`** at `/settings`: username from `useMeQuery`, logout button. No password change in v1. |
| **UI state placement** | **Page-local `useState`**: form fields, dialogs, field errors on the page that owns the action. Remove global `editingId` from `App.tsx`; route param replaces it on detail. |
| **Prefetch** | Keep ADR-007 `prefetchNote` on list item hover/focus on `NotesListPage`. Optional: `prefetchNote` on dashboard “latest note” link hover. |
| **Scroll restoration** | On **`/notes`**, restore list **scroll position** when returning from `/notes/:id` (browser back or breadcrumb). Implementation: `sessionStorage` key (e.g. `notes-list-scroll-y`) saved on leaving list route, restored on `NotesListPage` mount. Do not rely on default window scroll reset. |
| **Health fetch** | Add `getHealth()` in `frontend/src/api/health.ts` (or `system.ts`), `useHealthQuery` in `frontend/src/hooks/useHealth.ts`, key `['health']` in `keys.ts` (or `systemKeys.health()`). |
| **Query keys on logout** | Unchanged from ADR-007: remove `authKeys.all`, `notesKeys.all`; add `health` key removal if cached. |
| **Tests** | Update Playwright smoke: expect `/dashboard` after login; add `data-testid` per page (`dashboard-app`, `notes-app`, `note-detail-app`, `settings-app`, `login-app`). Session resolution tests from ADR-007 still apply with route adjustments. |
| **Folder layout** | See § Target layout. |

### Route table

| Path | Page | Access | Primary data hooks |
|------|------|--------|-------------------|
| `/login` | `LoginPage` | Public | `useLoginMutation` |
| `/dashboard` | `DashboardPage` | Protected | `useMeQuery`, `useNotesQuery`, `useHealthQuery` |
| `/notes` | `NotesListPage` | Protected | `useNotesQuery`, create/delete mutations |
| `/notes/:id` | `NoteDetailPage` | Protected | `useNoteQuery(id)`, update/delete mutations |
| `/settings` | `SettingsPage` | Protected | `useMeQuery` |
| `/` | — | — | Redirect per session |

### Rationale

- **react-router-dom** is the de facto React routing standard; aligns with brainstorm and avoids a second routing mental model (TanStack Router).
- **Dashboard as home** separates “overview” from “CRUD work” without new backend — teaches multi-domain pages (auth + notes + system health).
- **Detail as `/notes/:id`** exercises dynamic routes and direct URL entry; replaces `editingId` selection model.
- **Create on `/notes` only** avoids an extra route while matching user preference (dashboard CTA → list with empty form).
- **Component-driven data** (existing hooks) keeps v1 focused on routing/layout; loaders deferred to avoid coupling router config to QueryClient.
- **No backend work** preserves v1 as a frontend architecture increment on ADR-007 foundations.

### Rejected (for v1)

| Proposal | Reason |
|----------|--------|
| TanStack Router | Not in stack; ADR-007 patterns already on Query — add RR only for URL/layout |
| Keep single-page `App.tsx` gate | Defeats routing learning goal |
| `/notes/new` route | User chose create-on-list (brainstorm flow A) |
| Modal/detail panel without route change | Does not exercise dynamic routes or shareable URLs |
| `createBrowserRouter` + route loaders | Extra complexity; hooks + `enabled` already work |
| Search/sort query params now | Backlog v2; would need UX + URL sync design |
| Tags / pinned notes | Backlog v3; requires backend |
| Move form state into Query cache | ADR-007 explicitly keeps form in `useState` |

## Architecture

### Target layout (additions / moves)

```
frontend/src/
  api/
    health.ts              # NEW: getHealth() → GET /health
  query/
    keys.ts                # + healthKeys (or systemKeys)
  hooks/
    useHealth.ts           # NEW: useHealthQuery
    useAuth.ts             # unchanged
    useNotes.ts            # unchanged
  layouts/
    AppLayout.tsx          # NEW: nav, breadcrumbs outlet, footer
  pages/
    LoginPage.tsx          # NEW
    DashboardPage.tsx      # NEW
    NotesListPage.tsx      # NEW (from App list + create)
    NoteDetailPage.tsx     # NEW (from App edit flow)
    SettingsPage.tsx       # NEW
  components/
    ProtectedRoute.tsx     # NEW
    AppNav.tsx             # NEW (or inline in layout)
    Breadcrumbs.tsx        # NEW
    LoginForm.tsx          # moved/wired from pages
    NoteList.tsx           # reused
    NoteForm.tsx           # reused
    ConfirmDialog.tsx      # reused
    BuildInfo.tsx          # reused
  routes.tsx               # NEW: route config (or inline in App.tsx)
  App.tsx                  # BrowserRouter + session shells + Routes
  main.tsx                 # QueryClientProvider only (unchanged)
```

### Session and routing

ADR-007 session phases remain; **rendering location** changes:

| Phase | Condition | v1 UI location |
|-------|-----------|----------------|
| **Unauthenticated** | No token | `/login` (`LoginPage`) |
| **Resolving** | Token + `useMeQuery` pending | `ProtectedRoute` fallback (full-screen “Checking session…”) |
| **Authenticated** | Token + `useMeQuery` success | Protected pages via `AppLayout` |
| **Session expired** | JWT `exp` in the past and/or 401 on `/auth/me` | Token cleared → redirect `/login` with session-expired notice on `LoginForm` |
| **Session check failed** | Token + `useMeQuery` error (non-401) | Error shell with Retry (in `ProtectedRoute` or root) |

`LoginPage` is **not** shown while token exists and `useMeQuery` is pending — avoid login flash on refresh (ADR-007 compliance).

### Data flow (by page)

```
/login
  useLoginMutation → token → navigate /dashboard

/dashboard
  useMeQuery ──────────► GET /auth/me
  useNotesQuery ───────► GET /notes (count, latest)
  useHealthQuery ──────► GET /health

/notes
  useNotesQuery ───────► GET /notes
  mutations ───────────► POST /notes (on success → navigate /notes/:id)

/notes/:id
  useNoteQuery(id) ────► GET /notes/:id
  mutations ───────────► PUT/DELETE

/settings
  useMeQuery ──────────► GET /auth/me
  logout ──────────────► clear token, clear cache, navigate /login
```

### Navigation flows

1. **Login success** → `/dashboard`
2. **Dashboard “New note” / empty CTA** → `/notes` (empty create form)
3. **List row click** → `/notes/:id`
4. **Create success on list** → `/notes/:id` (server id)
5. **Delete on detail** → `/notes` after confirm
6. **Logout** (header or settings) → `/login`
7. **Direct URL** `/notes/42` with valid session → detail loads via `useNoteQuery`
8. **Direct URL** protected path without token → `/login`

## Implementation phases

Detailed checklist: `../../implementation-artifacts/spec-adr-008-frontend-routing-v1.md` (complete).

| Phase | Goal |
|-------|------|
| **1** | Add `react-router-dom`; `App.tsx` router shell; `/login`, `/`, `ProtectedRoute` skeleton |
| **2** | `AppLayout` + nav; `DashboardPage` + `useHealthQuery` |
| **3** | `NotesListPage` — extract list + create from `App.tsx` |
| **4** | `NoteDetailPage` — `/notes/:id`, breadcrumbs, delete → list |
| **5** | `SettingsPage`; wire logout from header + settings |
| **6** | Scroll restoration on `/notes`; update Playwright smoke + README |

## Consequences

### Positive

- App is no longer a single-screen CRUD demo — **four distinct user scenarios** (overview, CRUD list, CRUD detail, profile).
- URL reflects state — shareable note links, browser back/forward, e2e can assert paths.
- `App.tsx` shrinks to composition root — pages own UI state; aligns with how larger SPAs grow.
- Reuses ADR-007 Query investment; prefetch and optimistic patterns stay relevant across routes.
- Dashboard demonstrates **multi-query page** without new backend.

### Negative / trade-offs

- Large refactor of `App.tsx` — risk of regressions in create/edit/delete flows; phased migration recommended.
- Scroll restoration via `sessionStorage` is manual — not as elegant as data-router scroll APIs.
- E2E and `data-testid` assumptions (`notes-app` on `/`) must be updated.
- `useMeQuery` on every protected entry still costs one GET on refresh (unchanged from ADR-007).
- ADR-007 text “no React Router in v2” is **historical** — this ADR is the explicit pivot to multi-page.

## Compliance

- [x] ADR-008 accepted before routing implementation starts (this document).
- [x] `npm run lint`, `npm run build`, Playwright smoke pass after implementation.
- [x] README frontend section updated (routes, dev URLs).
- [x] `project-context.md` frontend rules updated when v1 ships (router, pages, protected routes).

## References

- Brainstorm: `_bmad-output/brainstorming/brainstorming-session-2026-06-05-1657.md` — agreed v1 scope, flows, backlog levels 2–3.
- ADR-007 — Query patterns reused; “no router” superseded by this ADR.
- `app/main.py` — `GET /health`.
- `frontend/e2e/session.spec.ts` — session smoke tests to adapt.

## Implementation status

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Router shell + login + protected skeleton | **Done** | 2026-06-07 |
| 2 — Layout + dashboard + health query | **Done** | 2026-06-07 |
| 3 — Notes list page | **Done** | 2026-06-07 |
| 4 — Note detail + breadcrumbs | **Done** | 2026-06-07 |
| 5 — Settings | **Done** | 2026-06-07 |
| 6 — Scroll restoration + e2e + docs | **Done** | 2026-06-07 |

**v1 is complete only when all six rows are done.**
