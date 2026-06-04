# ADR-005: TanStack Query for frontend server state

**Status:** Accepted  
**Date:** 2026-06-03  
**Scope:** `frontend/` Notes SPA — server state only (API reads/writes). UI state stays in React.  
**Related:** `.backup/react-state-problems-before-tanstack-query.md`, `../implementation-artifacts/plan-tanstack-query-phases.md`

## Context

The Notes UI (`App.tsx`) loads and mutates data with `useEffect` + `useState`:

- `notes`, `loading` — manual fetch on `isAuthenticated` with `cancelled` guard
- create/update/delete — manual `setNotes` patches after each mutation
- duplicated error mapping (`ApiError`, `TypeError`, 401) across load/save/delete

This matches the pre-Query pain points (copy-paste fetch, stale lists after POST, no shared cache policy). The app is small (one screen after login), which makes migration a **low-risk learning increment** without introducing React Router or a global client store.

**Out of scope for this ADR:**

- React Router, Zustand/Redux
- Optimistic updates, infinite scroll, Suspense queries (optional later)
- Moving JWT/session into Query (auth remains `localStorage` + `authFetch`)
- Full Playwright CRUD E2E against live API (still deferred per `project-context.md`)

## Decision

| Area | Choice |
|------|--------|
| Server state library | **@tanstack/react-query** (v5) |
| Client / UI state | **React `useState`** in components (form, `editingId`, dialogs, `isAuthenticated`) |
| API layer | Keep **`frontend/src/api/`** (`notesApi.*`, `authFetch`); `queryFn` / `mutationFn` call existing functions |
| Query keys | Central factory in `frontend/src/query/keys.ts` — e.g. `notes: { all: ['notes'] }` |
| Default cache | `staleTime: 30_000`, `gcTime: 5 * 60_000` in `QueryClient` `defaultOptions.queries` |
| Auth-gated fetch | `useQuery({ enabled: isAuthenticated })` for notes list |
| After mutations | **`invalidateQueries`** on `notes` key (v1; no manual `setNotes`) |
| Errors | **`throw`** in `queryFn` / `mutationFn`; UI reads `isError` / `error` (map `ApiError` in one helper) |
| 401 | Unchanged: `authFetch` clears token + `onUnauthorized`; queries go idle when logged out |
| DevTools | `@tanstack/react-query-devtools` — dev only, lazy-loaded |
| Tests | Existing Playwright smoke unchanged; manual smoke checklist per phase plan |

## Consequences

**Positive**

- One notes list cache; no duplicate GET if layout splits later
- Mutations stay simple: invalidate → list refetches
- Removes `cancelled` flag pattern from `App.tsx`
- Aligns with documented learning path (Provider → query → mutation → hooks)

**Negative / trade-offs**

- New dependency and mental model for contributors
- Brief loading flicker possible on invalidate (acceptable for Notes app size)
- `retry` on mutations should stay **0** to avoid duplicate POST

## Compliance

Implementation complete (v1): `plan-tanstack-query-phases.md` — **v1 complete**; `project-context.md` frontend rules updated (Phase 4).
