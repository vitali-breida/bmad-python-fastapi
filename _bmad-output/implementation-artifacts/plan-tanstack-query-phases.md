# TanStack Query migration plan (phased)

**ADR:** `../planning-artifacts/adr/adr-005-frontend-tanstack-query-server-state.md` (v1), `../planning-artifacts/adr/adr-007-frontend-tanstack-query-v2-patterns.md` (v2)  
**Status:** v1 complete (2026-06-03); **v2 complete** (ADR-007 implemented 2026-06-05)  
**Baseline (historical):** `frontend/src/App.tsx` — `useEffect` + `notes` / `loading` / manual `setNotes`  
**Implemented:** `hooks/useNotes.ts`, `query/{client,keys,errors}.ts`, `QueryClientProvider` in `main.tsx`  
**Learning notes:** `.backup/tanstack-query-my-progress.md`, `.backup/react-state-problems-before-tanstack-query.md`  
**Last updated:** 2026-06-05

## Summary

| Phase | Goal | User-visible outcome |
|-------|------|----------------------|
| **0** | Decision + deps | ADR accepted; packages install cleanly |
| **1** | Infrastructure | App runs with `QueryClientProvider`; DevTools in dev |
| **2** | Read path | Notes list via `useQuery`; same loading/error UX |
| **3** | Write path | Create / update / delete via `useMutation` + invalidate |
| **4** | Structure + cleanup | Feature hooks; `App.tsx` holds UI state only |
| **5** | Hardening | Error helper, CI lint/build, smoke checklist |

---

## Current state (what we migrate)

| Concern | Today (`App.tsx`) | After migration |
|---------|-------------------|-----------------|
| List GET | `useEffect` + `listNotes()` + `cancelled` | `useNotesQuery({ enabled: isAuthenticated })` |
| List data | `notes` state | `data` from query |
| Loading | `loading` state | `isPending` / `isFetching` |
| Create / update | `handleSubmit` + `setNotes` | `useCreateNote` / `useUpdateNote` + invalidate |
| Delete | `confirmDelete` + `setNotes` filter | `useDeleteNote` + invalidate |
| Form, selection, dialog | `useState` | **unchanged** (UI state) |
| Login | `LoginForm` local state + `login()` | **unchanged** in v1 (optional `useLoginMutation` later) |
| 401 | `authFetch` + `setAuthHandlers` | **unchanged** |

Problems addressed (see backup doc): **#1, #4–6, #9–11** for notes; auth stays imperative.

---

## Target layout

```
frontend/src/
  main.tsx                 # QueryClientProvider + optional DevTools
  query/
    client.ts              # QueryClient + defaultOptions
    keys.ts                # queryKey factory
    errors.ts              # mapQueryError(error) → user message + fieldErrors?
  hooks/
    useNotes.ts            # useNotesQuery, useCreateNote, useUpdateNote, useDeleteNote
  api/                     # unchanged fetch layer
  App.tsx                  # auth + UI state + wires hooks
```

---

## Phase 0 — Decision and dependencies

### Scope

- Accept ADR-005.
- Add packages (exact versions pinned on `npm install`):

```bash
cd frontend
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```

### Done when

- [ ] `package.json` lists both packages
- [ ] `npm run build` passes (no usage yet)

### Risks

- None; no runtime behavior change.

---

## Phase 1 — Provider and defaults

### Scope

- Create `frontend/src/query/client.ts`:

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

- Create `frontend/src/query/keys.ts`:

```ts
export const queryKeys = {
  notes: {
    all: ["notes"] as const,
  },
};
```

- Wrap app in `main.tsx`:

```tsx
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

- DevTools (dev only): lazy `ReactQueryDevtools` with `initialIsOpen={false}`.

### Done when

- [ ] App loads login screen as before
- [ ] DevTools panel opens in `npm run dev`
- [ ] No notes fetch logic moved yet

### Verification

```bash
cd frontend && npm run lint && npm run build
```

---

## Phase 2 — Read path (`useQuery`)

### Scope

- Add `frontend/src/hooks/useNotes.ts`:

```ts
export function useNotesQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.notes.all,
    queryFn: () => notesApi.listNotes(),
    enabled,
  });
}
```

- In `App.tsx`:
  - Remove `notes`, `loading` state and the `useEffect` that loads notes (lines ~38–77).
  - Use `const { data: notes = [], isPending, isError, error } = useNotesQuery(isAuthenticated)`.
  - Map errors via shared helper (Phase 5 can extract; interim: duplicate minimal mapping).
  - Keep `handleLogin` setting `isAuthenticated` only — **do not** manually `setLoading(true)`; query runs when `enabled` flips true.
  - On logout: `queryClient.removeQueries({ queryKey: queryKeys.notes.all })` to avoid showing previous user's notes in memory.

### UX parity checklist

- [ ] After login: “Loading notes…” while `isPending`
- [ ] List renders when data arrives
- [ ] API down: same global error banner text
- [ ] 401 on list: silent (handler logs out); no spurious error banner

### Done when

- [ ] No `useEffect` for notes fetch in `App.tsx`
- [ ] `notes` prop to `NoteList` comes from query `data`

---

## Phase 3 — Write path (`useMutation`)

### Scope

Extend `useNotes.ts` (or split `useNoteMutations.ts`):

| Hook | mutationFn | onSuccess |
|------|------------|-----------|
| `useCreateNote` | `notesApi.createNote` | `invalidateQueries({ queryKey: queryKeys.notes.all })` |
| `useUpdateNote` | `notesApi.updateNote` | same |
| `useDeleteNote` | `notesApi.deleteNote` | same |

- Replace `handleSubmit` / `confirmDelete` try/catch + `setNotes` with mutations.
- `saving` → `createMutation.isPending || updateMutation.isPending` (or single `useSaveNote` wrapper).
- On create success: `selectNote(created)` as today.
- On delete success: clear `pendingDelete`; if `editingId === id`, call `startNewNote()`.

### Done when

- [ ] No `setNotes` anywhere in `App.tsx`
- [ ] New note appears in list after create without manual array patch
- [ ] Edit and delete reflect server state after invalidate

### Optional (defer)

- Optimistic `setQueryData` — not needed for v1
- `useLoginMutation` in `LoginForm`

---

## Phase 4 — Cleanup and conventions

### Scope

- Extract `mapApiError(err)` → `{ globalMessage?, fieldErrors? }` in `query/errors.ts`.
- Ensure all hooks `throw` from API layer (already via `parseJson` / `apiErrorFromResponse`).
- Update `_bmad-output/project-context.md` frontend section:
  - Server state: TanStack Query
  - UI state: local `useState`
  - Pattern: `api/` + `hooks/` + `query/keys.ts`

### Done when

- [ ] `App.tsx` roughly ≤120 lines of wiring (guideline, not hard gate)
- [ ] `project-context.md` mentions Query

---

## Phase 5 — Verification and CI

### Commands

| Command | Expect |
|---------|--------|
| `cd frontend && npm run lint` | Pass (watch `set-state-in-effect` if reintroducing effects) |
| `cd frontend && npm run build` | Pass |
| `cd frontend && CI=true npm run test:e2e` | Login smoke still passes |

### Manual smoke (authenticated)

1. Start API: `uvicorn` on :8000, frontend `npm run dev`.
2. Log in → list loads.
3. Create note → appears in list, editor selects it.
4. Edit title → list updates after save.
5. Delete → removed from list; editor resets if deleted note was open.
6. Log out → login screen; log in again → fresh list (no stale cache leak).
7. DevTools: one `['notes']` query; after save, invalidation refetch visible.

### Done when

- [x] `npm run lint` — pass (2026-06-03)
- [x] `npm run build` — pass (2026-06-03)
- [x] `CI=true npm run test:e2e` — login smoke pass (2026-06-03)
- [x] Manual smoke (authenticated) — verified (2026-06-03)
- [x] Plan status → **v1 complete**

---

## Rollback

Per phase, revert the last commit for that phase. Worst case: remove Provider and restore `useEffect` block from git history — API layer unchanged.

---

## v2 phases (ADR-007)

| Phase | Goal | User-visible outcome |
|-------|------|----------------------|
| **6** | Key hierarchy + API helpers | `authKeys` / `notesKeys`; `getMe()`, `getNote(id)` in `api/` |
| **7** | Auth session in Query | Login via `useLoginMutation`; session from `useMeQuery`; no `isAuthenticated` state |
| **8** | Detail + optimistic CRUD | `updated_at` visible; instant list updates; rollback on error |
| **9** | Prefetch + docs + smoke | Hover prefetch; `project-context.md` updated; manual smoke green |

---

## Phase 6 — Key hierarchy and API helpers

### Scope

- Replace flat `queryKeys.notes.all` with hierarchical `authKeys` + `notesKeys` in `frontend/src/query/keys.ts`.
- Add `getMe()` to `frontend/src/api/auth.ts` (`GET /auth/me` via `authFetch`).
- Add `getNote(id)` to `frontend/src/api/notes.ts` (`GET /notes/{id}`).
- Add `frontend/src/types/user.ts` mirroring backend `UserRead` if not present.
- Migrate `useNotesQuery` to `notesKeys.list()` (keep `notesKeys.all` for logout `removeQueries`).

### Done when

- [ ] Key factory matches ADR-007 table
- [ ] API helpers typed and throw `ApiError` on failure
- [ ] `npm run lint && npm run build` pass
- [ ] No behaviour change yet (list still uses invalidate-only mutations)

---

## Phase 7 — Auth session (`useAuth.ts`)

### Scope

- Create `frontend/src/hooks/useAuth.ts`: `useMeQuery`, `useLoginMutation`.
- `useMeQuery`: `enabled: !!getAccessToken()`, `retry: false`, `queryKey: authKeys.me()`.
- `useLoginMutation`: `onSuccess` → `invalidateQueries({ queryKey: authKeys.me() })`.
- `App.tsx`: remove `isAuthenticated` `useState`; implement **session resolution states** per ADR-007 § Session resolution states (Unauthenticated / Resolving / Authenticated / Session expired / Session check failed).
- `useNotesQuery`: `enabled` only when `useMeQuery` `isSuccess` with data — not raw token.
- `LoginForm`: wire `useLoginMutation` instead of imperative `login()` callback where practical.
- Logout: `clearAccessToken()` + remove `authKeys.all` and `notesKeys.all` from cache.
- **401 / `onUnauthorized`:** same cache cleanup as logout (`authKeys.all` + `notesKeys.all`) — replace v1 notes-only `removeQueries` in `resetAuthSession`.
- Session check failed UI: global message + Retry (`meQuery.refetch()`); do not clear token.

### UX parity checklist

- [ ] Valid token on refresh → “Checking session…” (not login flash) → notes load
- [ ] Invalid/expired token → login screen (401 from `/me` silent; no error banner)
- [ ] API down on load with token → error shell + Retry; token kept; Retry succeeds when API returns
- [ ] Login success → notes query enables and loads
- [ ] Logout → login screen; no stale auth or notes in DevTools cache

### Done when

- [ ] No `isAuthenticated` state in `App.tsx`
- [ ] `npm run lint && npm run build` pass
- [ ] `CI=true npm run test:e2e` smoke pass

---

## Phase 8 — Detail query, `updated_at`, optimistic CRUD

### Scope

- `useNoteQuery(id)` with `enabled: id != null && id > 0` (skip optimistic temp negative ids) and `placeholderData` from list cache.
- Show `updated_at` in `NoteList` and/or editor (formatted, locale-aware or ISO slice).
- Optimistic `useCreateNote`, `useUpdateNote`, `useDeleteNote`:
  - `onMutate` / snapshot / `setQueryData` / rollback / `onSettled` invalidate per ADR-007.
- Temp negative id for optimistic create; on success replace in list cache and set `editingId` to server id.

### UX parity checklist

- [ ] Select note → detail available without spinner when list had the row
- [ ] Save → list updates immediately; rolls back on simulated API error
- [ ] Delete → row disappears immediately; rolls back on error
- [ ] `updated_at` shown after first edit (null on create per ADR-002)

### Done when

- [ ] No invalidate-only mutations left (all three use optimistic lifecycle)
- [ ] Manual smoke: create, edit, delete with DevTools showing cache patches

---

## Phase 9 — Prefetch, docs, verification

### Scope

- `prefetchNote(queryClient, id)` in `useNotes.ts`; trigger on list item hover/focus.
- Update `_bmad-output/project-context.md` frontend rules for ADR-007.
- Manual smoke checklist (below).
- Mark ADR-007 implementation status table **Done**.

### Manual smoke (v2)

**Session (ADR-007 § Smoke scenarios — re-run at v2 sign-off):**

1. Refresh with valid token → “Checking session…” → notes load (no login flash).
2. Refresh with expired/invalid token → Resolving → `LoginForm` (401 from `/me` silent; no error banner).
3. Stop API, reload with token in storage → Session check failed shell + **Retry**; start API → Retry → Authenticated.
4. Login success → `useLoginMutation` → `/me` + notes load.

**Cache, mutations, prefetch (phases 8–9):**

5. Hover note → DevTools shows prefetched `notesKeys.detail(id)` query.
6. Create / edit / delete — optimistic list updates; rollback on simulated API error.
7. Logout → `authKeys` + `notesKeys` cleared in DevTools; `LoginForm` shown.

**CI:**

8. `npm run lint`, `npm run build`, `CI=true npm run test:e2e`.

### Done when

- [ ] ADR-007 compliance checklist ticked
- [ ] `project-context.md` reflects v2 patterns
- [ ] Plan status → **v2 complete**

---

## Deferred backlog (post-v2)

| Item | When |
|------|------|
| `useInfiniteQuery` | Paginated notes API exists |
| React Router + route-level prefetch | User asks for multi-page SPA |
| Unit tests with `QueryClientProvider` + `renderHook` | User asks for component tests |
| E2E: full CRUD with test user | `deferred-work.md` |
| `persistQueryClient` / offline | Separate ADR |

*v1 deferred items (optimistic, auth mutation, prefetch) moved to ADR-007 phases 7–9.*

---

## Suggested implementation order

**v1 (complete):**

1. `chore(frontend): add @tanstack/react-query` — Phase 0–1  
2. `refactor(frontend): load notes with useQuery` — Phase 2  
3. `refactor(frontend): note mutations with useMutation` — Phase 3  
4. `refactor(frontend): query error helper and docs` — Phase 4–5  

**v2 (ADR-007):**

5. `refactor(frontend): query key hierarchy and api helpers` — Phase 6  
6. `refactor(frontend): auth session with useMeQuery and useLoginMutation` — Phase 7  
7. `refactor(frontend): optimistic note mutations and detail query` — Phase 8  
8. `feat(frontend): prefetch note detail and update project-context` — Phase 9  

---

## Quick reference

**v1 (current):**

**Read:** `queryKey: ['notes']` → `queryFn: listNotes` → `enabled: isAuthenticated`  

**Write:** `useMutation` → `onSuccess: invalidateQueries({ queryKey: ['notes'] })`  

**UI:** form, `editingId`, `pendingDelete`, `isAuthenticated` stay in `useState`.

**v2 (target, ADR-007):**

**Auth:** `authKeys.me()` → `getMe` → `enabled: !!token`; login → `useLoginMutation` → invalidate `me`  

**Read:** `notesKeys.list()` + `notesKeys.detail(id)` with `placeholderData` from list  

**Write:** optimistic `onMutate` → `setQueryData` → rollback → `onSettled` invalidate  

**UI:** form, `editingId`, `pendingDelete` stay in `useState`; auth gate from `useMeQuery`, not `isAuthenticated`
