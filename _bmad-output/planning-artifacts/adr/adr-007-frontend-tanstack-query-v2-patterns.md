# ADR-007: TanStack Query v2 — cache patterns and auth session

**Status:** Accepted  
**Date:** 2026-06-05  
**Scope:** `frontend/` Notes SPA — extend server-state patterns introduced in ADR-005. No backend API changes required for v2.  
**Related:** ADR-005 (v1 baseline), ADR-003 (`GET /auth/me`, JWT), `../implementation-artifacts/plan-tanstack-query-phases.md` (phases 6–9), party mode 2026-06-05 (Winston, John, Sally, Amelia).  
**Supersedes (partial):** ADR-005 decisions on query-key shape, auth gate (`isAuthenticated` in `useState`), invalidate-only mutations, and deferred optimistic/prefetch/auth-in-Query items. ADR-005 text says `localStorage` for the token; implementation and this ADR use **`sessionStorage`** — treat ADR-005 storage wording as stale.

## Context

ADR-005 delivered TanStack Query v1: notes list via `useQuery`, writes via `useMutation` + `invalidateQueries`, single key `['notes']`, and imperative auth (`sessionStorage` + `isAuthenticated` in `App.tsx`). Implementation is **complete** (plan phases 0–5, 2026-06-03).

The frontend layering (`api/` → `hooks/` → `query/`) is in place but feels like **scaffolding without load**: one flat query key, auth outside Query, and no granular cache updates. The learning goal is to **practice TanStack Query patterns** on real features while keeping the app a single-page Notes SPA (no React Router in v2).

**Backend already available but unused in UI:**

| Endpoint | Purpose |
|----------|---------|
| `GET /auth/me` | Current user profile (`UserRead`) |
| `GET /notes/{id}` | Single note (includes `updated_at`) |

**Out of scope for this ADR:**

- React Router, URL-driven navigation, `prefetchQuery` tied to route transitions
- `useInfiniteQuery` / server pagination (no paginated notes API)
- `persistQueryClient` / offline cache
- WebSocket or realtime sync
- Autosave drafts, undo delete, conflict-resolution UI
- Full Playwright CRUD E2E (remains deferred per `deferred-work.md`)
- Backend changes (search `?q=`, sort, pagination, new fields)
- Global client state (Zustand/Redux)

## Decision

| Area | Choice |
|------|--------|
| **Relationship to ADR-005** | **Extend**, do not replace. Keep `api/`, `query/client.ts`, `query/errors.ts`, DevTools, `authFetch` 401 handling. |
| **Query key factory** | Hierarchical keys in `frontend/src/query/keys.ts`: |
| | `authKeys.all` → `['auth']`; `authKeys.me()` → `['auth', 'me']` |
| | `notesKeys.all` → `['notes']`; `notesKeys.list()` → `['notes', 'list']`; `notesKeys.detail(id)` → `['notes', 'detail', id]` |
| | Migrate existing list query from `queryKeys.notes.all` to `notesKeys.list()`. `notesKeys.all` used for broad `invalidateQueries` / `removeQueries` on logout. |
| **Auth session** | **`useMeQuery`** — `queryKey: authKeys.me()`, `queryFn: getMe()` via `authFetch`, `enabled: !!getAccessToken()`, `retry: false`. |
| | **`useLoginMutation`** — `mutationFn: login`, `onSuccess` → `invalidateQueries({ queryKey: authKeys.me() })` (or `setQueryData` if login response is extended later). |
| | **Remove** manual `isAuthenticated` `useState` gate; derive UI from **session resolution states** (see Architecture § Session resolution states). |
| | **Token storage** unchanged: `sessionStorage` (`access_token`); `authFetch` still clears token on 401. |
| **Logout** | `clearAccessToken()` + `queryClient.removeQueries({ queryKey: notesKeys.all })` + `queryClient.removeQueries({ queryKey: authKeys.all })` (or `queryClient.clear()` if simpler and safe). |
| **Notes list** | `useNotesQuery(enabled)` — `queryKey: notesKeys.list()`, `enabled` tied to successful auth (not raw token alone). |
| **Note detail** | **`useNoteQuery(id)`** — `queryKey: notesKeys.detail(id)`, `enabled: id != null && id > 0`, `queryFn: () => getNote(id)`. **Do not** fetch detail for optimistic temp ids (negative `id` from create `onMutate`). |
| | **`placeholderData`**: resolve note from list cache when available (instant open, background refetch). Editor **form** stays in `useState`; detail query is for cache exercise, `updated_at` refresh, and prefetch — not form field source. |
| | Add **`getNote(id)`** to `frontend/src/api/notes.ts` (calls existing `GET /notes/{id}`). |
| | Add **`getMe()`** to `frontend/src/api/auth.ts` (calls existing `GET /auth/me`). |
| | Add **`frontend/src/types/user.ts`** mirroring backend `UserRead` (`id`, `username`). |
| **UI: `updated_at`** | Show formatted `updated_at` in `NoteList` and/or editor when note is selected (field already on `Note` type). |
| **Mutations (notes)** | **Optimistic updates** for create, update, delete: |
| | `onMutate` → `cancelQueries` on affected keys → snapshot previous cache → `setQueryData` |
| | `onError` → restore snapshot |
| | `onSettled` → `invalidateQueries` on `notesKeys.list()` and affected `notesKeys.detail(id)` |
| | Create: temporary negative `id` in list cache until server returns real id; on success replace in list cache **and** set `editingId` to the server id (so `useNoteQuery` can enable). |
| | Delete: remove from list (+ `removeQueries` on detail key); rollback on error. |
| | **Mutation `retry` stays 0** (ADR-005). |
| **Prefetch** | **`prefetchNote(id)`** helper — `queryClient.prefetchQuery({ queryKey: notesKeys.detail(id), queryFn, staleTime: 30_000 })` on list item `onMouseEnter` / `onFocus`. |
| **UI state (unchanged)** | **Local `useState` in `App.tsx`**: form fields (`title`, `body`), `editingId`, `pendingDelete`, dialog open state, field/global error display wiring. **Do not** move form draft into Query cache. |
| **Hooks layout** | New **`frontend/src/hooks/useAuth.ts`** (`useMeQuery`, `useLoginMutation`). Extend **`useNotes.ts`** with `useNoteQuery`, optimistic mutations, `prefetchNote`. |
| **Errors** | Reuse `query/errors.ts` (`mapApiError`, `applyMappedError`). Auth and notes mutations share the same mapper. |
| **Tests** | Existing Playwright smoke unchanged for v2 acceptance; manual smoke checklist extended in phase plan. Unit/hook tests optional unless user requests. |

### Rationale

- **Hierarchical keys** unlock granular `setQueryData`, targeted invalidation, prefetch, and optimistic updates — the patterns deferred in ADR-005.
- **`/auth/me` as query** gives one server-backed session source; page refresh re-validates token without duplicating auth logic in `useState`.
- **Optimistic mutations** make Query value visible in UX (instant list updates) and justify the `hooks/` layer beyond thin `invalidateQueries` wrappers.
- **`placeholderData` + prefetch** exercise cache reads without React Router.
- **No backend work** keeps v2 a frontend learning increment on the existing API surface.
- **UI state stays local** per ADR-005 principle; only server-owned data lives in Query.

### Rejected (for v2)

| Proposal | Reason |
|----------|--------|
| React Router now | ADR-005 deferred; not required for listed Query patterns |
| `useInfiniteQuery` without paginated API | Over-engineering; fake pagination teaches wrong contract |
| Auth token inside Query cache as sole source | Token remains in `sessionStorage`; Query holds **user profile**, not secrets |
| Optimistic login | Login is not list-shaped; invalidate `/me` is sufficient |
| `queryClient.persistQueryClient` | Offline scope; distracts from mutation/cache practice |
| New `libs/` or `utils/` folders | Existing `api/`, `query/`, `hooks/` sufficient |

## Architecture

### Target layout (additions only)

```
frontend/src/
  api/
    auth.ts          # + getMe()
    notes.ts         # + getNote(id)
  types/
    user.ts          # UserRead mirror (phase 6)
  query/
    keys.ts          # authKeys + notesKeys hierarchy
  hooks/
    useAuth.ts       # NEW: useMeQuery, useLoginMutation
    useNotes.ts      # + useNoteQuery, optimistic mutations, prefetchNote
  App.tsx            # auth from useMeQuery; wires hooks; UI state unchanged
  components/        # NoteList: updated_at, prefetch triggers; LoginForm: mutation
```

### Data flow

```
sessionStorage (token)
       │
       ▼
useMeQuery (enabled if token) ──► GET /auth/me ──► authKeys.me()
       │
       ▼ (success)
useNotesQuery ──► GET /notes ──► notesKeys.list()
       │
       ▼ (select id)
useNoteQuery(id) ──► GET /notes/:id ──► notesKeys.detail(id)
       │                    ▲
       │                    └── placeholderData from list cache
       └── prefetch on hover ──► prefetchQuery(detail)

Mutations ──► onMutate (optimistic setQueryData) ──► API ──► onSettled (invalidate)
```

### Logout and 401

- **Logout (explicit):** clear token, remove auth + notes queries from cache, reset UI form/selection.
- **401 (authFetch):** clear token, then `onUnauthorized` — **must** `removeQueries` on `authKeys.all` and `notesKeys.all` (same as logout), not notes-only. Queries become disabled when token is gone. No error banner for silent session expiry on background refetch (same as ADR-005 list behaviour).

### Session resolution states

Replace `isAuthenticated` with a **derived session phase** from token presence + `useMeQuery` status. `useNotesQuery` enables **only** when `useMeQuery` is `isSuccess` with profile data — never on raw token alone.

| Phase | Condition | UI | `useNotesQuery` |
|-------|-----------|-----|-----------------|
| **Unauthenticated** | No token in `sessionStorage` | `LoginForm` | `enabled: false` |
| **Resolving** | Token exists, `useMeQuery` `isPending` | Loading shell (e.g. “Checking session…”); **not** `LoginForm` | `enabled: false` |
| **Authenticated** | Token + `useMeQuery` `isSuccess` with data | Full Notes app | `enabled: true` |
| **Session expired** | `GET /auth/me` returns **401** | `LoginForm`; **no** error banner | `authFetch` clears token; `onUnauthorized` removes `authKeys.all` + `notesKeys.all` |
| **Session check failed** | Token + `useMeQuery` `isError` (network, 5xx, non-401 API error) | Error shell with message + **Retry** button (`refetch()`); token **unchanged** | `enabled: false` |

**Implementation notes (phase 7):**

- **`App.tsx` gate:** `showApp = meQuery.isSuccess`; `showResolving = !!getAccessToken() && meQuery.isPending`; `showSessionError = !!getAccessToken() && meQuery.isError`; else `LoginForm` (or session error when `showSessionError`).
- **Do not** map `isError` to `LoginForm` while token remains — that shows login with a stale token in storage and confuses re-sign-in.
- **401 path:** `authFetch` clears token before `onUnauthorized`; `onUnauthorized` removes `authKeys.all` + `notesKeys.all` from cache (phase 7 — replace v1 notes-only `removeQueries`).
- After 401, `useMeQuery` is disabled and UI falls through to Unauthenticated without needing a special `isError` branch for 401.
- **Retry path:** Session check failed keeps the token; user clicks Retry → `meQuery.refetch()` → Resolving → Authenticated or Session check failed again.
- **E2E note:** Playwright smoke waits for `notes-app`; after phase 7 that implies `/auth/me` success. If CI flakes, add `/auth/me` wait or timeout in phase 7 verification — not an ADR scope change.

**Smoke scenarios:**

1. Refresh with valid token → Resolving → Authenticated (no login flash).
2. Refresh with expired token → Resolving → Session expired → LoginForm (silent).
3. API stopped on load with token in storage → Session check failed → Retry after API up → Authenticated.
4. Login success → `useLoginMutation` sets token → invalidate `authKeys.me()` → Authenticated → notes load.

## Implementation phases

Detailed checklist: `../implementation-artifacts/plan-tanstack-query-phases.md` **phases 6–9**.

| Phase | Goal |
|-------|------|
| **6** | Key hierarchy + API helpers (`getMe`, `getNote`) |
| **7** | Auth session (`useAuth.ts`, remove `isAuthenticated` state) |
| **8** | Note detail query, `updated_at` in UI, optimistic CRUD |
| **9** | Prefetch on hover + manual smoke + `project-context.md` update |

## Consequences

### Positive

- Frontend layers gain **concrete patterns** per file; scaffolding becomes a platform.
- Auth and notes flows are **symmetric** (both Query-backed).
- Teaches production-relevant TanStack APIs: key factories, dependent queries, optimistic lifecycle, prefetch, `placeholderData`.
- Reuses existing backend endpoints with no migration risk.

### Negative / trade-offs

- Optimistic create with temp ids adds complexity; rollback paths must be tested manually.
- Broader invalidation on `onSettled` may still cause brief refetch flicker (acceptable).
- `useMeQuery` adds one GET on every session start (including page refresh with valid token).
- ADR-005 docs and `project-context.md` frontend rules are **stale until phase 9** completes.

## Compliance

- [x] ADR-007 accepted before implementation starts (this document).
- [x] Phases 6–9 in `plan-tanstack-query-phases.md` tracked to completion.
- [x] `project-context.md` frontend section updated when v2 ships (auth in Query, key hierarchy, optimistic mutations).
- [x] `npm run lint`, `npm run build`, existing Playwright smoke pass after each phase (or at phase 9 minimum).

## References

- Party mode 2026-06-05: user aligned with Winston — key hierarchy → auth query → optimistic CRUD → prefetch; router and infinite query deferred.
- ADR-005 v1 complete; deferred backlog items (optimistic, auth mutation, prefetch) moved into this ADR.
- `app/routers/auth.py` — `GET /auth/me`; `app/routers/notes.py` — `GET /notes/{note_id}`.

## Implementation status

| Phase | Status | Notes |
|-------|--------|-------|
| 6 — Key hierarchy + API helpers | **Done** | 2026-06-05 |
| 7 — Auth session queries | **Done** | 2026-06-05 |
| 8 — Detail query + optimistic CRUD + `updated_at` | **Done** | 2026-06-05 |
| 9 — Prefetch + docs + smoke | **Done** | 2026-06-05 |

**v2 is complete only when all four rows are done.**
