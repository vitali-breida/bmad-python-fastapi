---
stepsCompleted: [1]
inputDocuments: ['_bmad-output/project-context.md']
session_topic: 'React state management — Context, Zustand, TanStack Query vs hooks/Redux; evaluate fit and adoption plan for this frontend'
session_goals: 'Clarify what each tool solves; map to current App.tsx patterns; outline a pragmatic adoption path (learning + implementation)'
session_scope_pivoted: '2026-05-25 — user pivoted from project-direction brainstorm to frontend state management'
selected_approach: 'technical-exploration (progressive-flow abandoned)'
techniques_used: []
ideas_generated: []
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Vitali
**Date:** 2026-05-25

## Session Overview

**Topic:** React state management for the Notes SPA — compare **hooks**, **Redux**, **React Context**, **Zustand**, and **TanStack Query**; decide what to adopt in `frontend/`.

**Goals:**
- Understand boundaries: server state vs client/UI state (not “one winner for everything”).
- Relate options to brownfield code (`App.tsx` centralizes auth, notes CRUD, loading/errors, form state).
- Produce an adoption shortlist and phased plan suitable for a learning project (portfolio depth without over-engineering).

**Background (facilitator):** User has prior experience with hooks and Redux; hearing Context, Zustand, TanStack Query in the ecosystem and wants clarity before implementation.

### Context Guidance

- **Stack today:** React 19 + TypeScript + Vite; no Redux, Zustand, Query, or Context providers yet.
- **`App.tsx`:** ~10 `useState` hooks, manual `useEffect` fetch for notes, auth flag from `getAccessToken()`, handlers passed to child components.
- **API layer:** `frontend/src/api/` (`auth.ts`, `notes.ts`, `client.ts`) — good seam for Query hooks.
- **Prior brainstorm thread:** `brainstorming-session-2026-05-21-1425.md` (authn) — completed direction via ADR-003; separate from this session.

### Session Setup

- Started as project-direction **Progressive Technique Flow**; user redirected to state-management exploration.
- **Language convention:** session markdown in English; live chat in Russian.

---

## Key insight: two kinds of state

| Kind | Examples in this app | Typical tools |
|------|----------------------|---------------|
| **Server / async state** | `notes` list, loading, API errors, cache after mutate | **TanStack Query** (or RTK Query, SWR) |
| **Client / UI state** | login form fields, `editingId`, `pendingDelete`, `form` draft | **useState** / **useReducer**, **Zustand**, Context (sparingly) |
| **Cross-cutting session** | `isAuthenticated`, token lifecycle | Small **Context** or **Zustand** slice; can stay in Query + auth module initially |

**TanStack Query is not a Redux replacement** — it manages remote data: fetch, cache, stale time, refetch, mutations, deduplication. **Redux / Zustand** target client-global UI and business state you own in the browser.

---

## Tool comparison (concise)

### Hooks (`useState`, `useReducer`, `useEffect`)

- **Best for:** local component state, simple flows, prototypes.
- **Pain here:** `App.tsx` already holds auth + list + form + dialog — prop drilling and mixed concerns grow with each feature.
- **Verdict:** Keep for truly local UI (e.g. `LoginForm` field state); avoid expanding the “god component” pattern.

### Redux (especially Redux Toolkit)

- **Best for:** large apps, strict event traceability, middleware, time-travel debugging, teams standardized on Redux.
- **Cost:** boilerplate, mental model, often **RTK Query** added anyway for server state.
- **Verdict:** Valid if goal is **deep Redux practice**; **overkill** for current app size unless you explicitly want portfolio Redux + DevTools.

### React Context

- **Best for:** infrequent updates — theme, locale, auth “session” flag, feature flags.
- **Risks:** re-renders when value changes often; easy to create one giant context.
- **Verdict:** Fine for **auth session provider** (read token / `isAuthenticated`); **not** for notes list + loading (use Query instead).

### Zustand

- **Best for:** lightweight global **client** store without Provider tree; selectors; less ceremony than Redux.
- **Verdict:** Good if you need shared UI state across distant components (wizard steps, filters, sidebar) without Query. Optional for this app at first.

### TanStack Query

- **Best for:** `listNotes`, create/update/delete mutations, `isLoading` / `isError`, invalidation after mutate, retry, devtools.
- **Replaces in `App.tsx`:** manual `useEffect` + `setNotes` + `setLoading` + much of `setGlobalError` for server operations.
- **Verdict:** **Highest ROI** for this codebase — aligns with “notes from API” as the core async concern.

---

## Recommended stack for this project

**Pragmatic default (learning + maintainability):**

1. **TanStack Query** — server state for notes (and optionally wrap login mutation).
2. **useState / useReducer** — form fields, dialog open, `editingId` (local or colocated in feature components).
3. **Context (optional, small)** — `AuthProvider` with `isAuthenticated` + `login` / `logout` if you split `App.tsx`; or keep auth in a thin custom hook reading `api/auth.ts`.
4. **Zustand** — add only when you feel real pain from prop drilling **without** server data (e.g. multi-panel UI).
5. **Redux** — skip unless the learning goal is explicitly Redux Toolkit.

**Anti-pattern to avoid:** putting fetched `notes[]` in Redux *and* Query, or in Context with frequent updates.

---

## Adoption phases (draft)

| Phase | Scope | Outcome |
|-------|--------|---------|
| **0** | Split `App.tsx` into `NotesPage` + hooks colocated | Smaller surface before libraries |
| **1** | Add `@tanstack/react-query`, `QueryClientProvider` in `main.tsx` | `useNotes()`, `useCreateNote()`, etc. |
| **2** | Mutations + `queryClient.invalidateQueries` | Delete/create/update without manual list sync |
| **3** | Extract `useAuth` or `AuthContext` | Children stop receiving auth setters from `App` |
| **4** (optional) | Zustand for cross-cutting UI prefs | Only if phase 3 still feels cramped |
| **5** (optional) | RTK learning spike | Separate branch / repo slice, not required for Notes MVP |

---

## Open questions (for next chat turn)

1. Primary learning goal: **Query mastery**, **Redux refresh**, or **minimal deps**?
2. Keep all state refactors in one PR or phase-per-PR?
3. E2E (Playwright): assert behavior unchanged after Query migration?

---

## Deliverables (pending)

- [ ] ADR or short spec: `frontend state management` (optional, if team wants recorded decision)
- [ ] Implementation story / quick-dev when ready to code
