---
title: 'ADR-009 Frontend Dashboard & Notes UX v2'
type: 'feature'
created: '2026-06-05'
status: 'done'
baseline_commit: '5fad46e3e4ddcbde22bd9e25e3545fdfe6ce125a'
context:
  - '{project-root}/_bmad-output/planning-artifacts/adr/adr-009-frontend-dashboard-notes-ux-v2.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-design-specification.md'
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** ADR-008 routing is shipped, but page roles are unclear: Dashboard behaves like a demo landing (stat cards, misleading “latest note”, API version noise); Notes list uses a pre-routing 50/50 split; create/save feedback is silent; list delete is a misclick-prone inline red link.

**Approach:** Refactor Dashboard, Notes list, Note detail, and Settings **within the existing five-route map** (D1 — Expand Panel). Introduce hub/browse/work roles per UX spec: Dashboard shows 3–5 recent notes with shared sort; Notes list is list-only with collapsible create panel; detail is the sole edit surface; API version moves to Settings Developer info. Reuse ADR-007/008 Query hooks, scroll restoration, prefetch, and session patterns.

## Boundaries & Constraints

**Always:** Keep route table unchanged (`/dashboard`, `/notes`, `/notes/:id`, `/settings`, `/login`). Reuse `AppLayout`, `AppNav`, `ProtectedRoute`, `ConfirmDialog`, `Breadcrumbs`, `BuildInfo`, `hooks/useNotes.ts` mutation logic. Form state stays page-local `useState`. Tailwind utilities only — no new UI npm deps. Custom `Toast` component (no sonner/react-hot-toast). `sortNotesForDisplay()` is the single sort source for Dashboard recent and Notes list. Post-create toast uses `location.state` handoff to detail page.

**Ask First:** Route map changes; backend list ordering change bundled with this PR; new toast/accordion libraries; mobile-first nav redesign.

**Never:** `/notes/new` route; post-login redirect away from `/dashboard`; search/sort query params; unsaved-changes warning; authz UI; full Playwright CRUD matrix rewrite (smoke + selector updates only).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Dashboard hub | Notes loaded | Greeting + tagline + up to 5 recent rows (`sortNotesForDisplay` slice); single “New note” CTA | Notes error → `role="alert"` (not empty-state mask) |
| Dashboard empty | Zero notes | One card + CTA → `/notes?new=1` | N/A |
| Dashboard → create | Click “New note” | `/notes`, create panel expanded, empty form, URL has no `?new=1` | N/A |
| `?new=1` mount | `/notes?new=1` | Expand panel, reset form, `replace` → `/notes` | Malformed query ignored |
| `?new=1` browser back | User backs after strip | Lands on `/notes` without re-expanding (no saved `?new=1`) | Acceptable v1 |
| Notes list browse | Notes exist, default | List-only full width; create panel **collapsed** | List error → alert banner |
| Notes list empty | Zero notes | Create panel **expanded** by default | Updated empty copy (no “side-by-side form” wording) |
| Create note | Submit in expand panel | `POST` → navigate `/notes/:id` with `state.toast`; toast visible on detail | Field/global errors inline |
| Update note | Save on detail | Toast “Saved” ~3s | Mutation error → alert |
| Detail back | “Back to notes” | Navigate `/notes`; scroll restore unchanged from ADR-008 | N/A |
| List delete | ⋯ → Delete → confirm | Row removed; stay on list; clear `last-note` if id matches | Error alert on failure |
| Detail delete | Confirm | Navigate `/notes`; clear `last-note` if id matches | Error alert on failure |
| Continue editing | `last-note` in storage, note still in list | Dashboard link with stored title → `/notes/:id` | Hide if id absent from list cache; clear on delete |
| Continue editing stale | Note deleted elsewhere | Link hidden (id not in sorted list) | `last-note` cleared on delete paths |
| Settings dev info | Expand Developer info | `useHealthQuery` shows API `version` | Error inline in section |
| Dashboard health | After refactor | No `useHealthQuery` on Dashboard | N/A |
| Sort tie-break | Equal `updated_at` or both null | Higher `id` first | Malformed date → treat as `0` (same as null) |
| Scroll restore | Back from detail to list | Unchanged ADR-008 `notes-list-scroll-y` behavior | NaN guard preserved |

</frozen-after-approval>

## Code Map

- `frontend/src/utils/notesSort.ts` — NEW: `sortNotesForDisplay(notes)` with NaN-safe date parse
- `frontend/src/utils/lastNote.ts` — NEW (recommended): read/write/clear `sessionStorage` key `last-note` (`{ id, title }`)
- `frontend/src/components/Toast.tsx` — NEW: fixed bottom-right, auto-dismiss, `data-testid="toast"`
- `frontend/src/components/RecentNotesList.tsx` — NEW: `data-testid="recent-notes"`; rows reuse `NoteListItem` or shared row props
- `frontend/src/components/ExpandableCreatePanel.tsx` — NEW: wraps `NoteForm`; `data-testid="create-panel"`
- `frontend/src/components/NoteListItem.tsx` — NEW: row + ⋯ overflow delete; prefetch on hover/focus
- `frontend/src/components/DeveloperInfo.tsx` — NEW: `<details>` + `useHealthQuery`
- `frontend/src/components/NoteList.tsx` — REFACTOR: map `NoteListItem`; sorted input; updated empty copy
- `frontend/src/components/NoteForm.tsx` — REFACTOR: `secondaryLabel` + `onSecondary` (replace hardcoded `onNew` label)
- `frontend/src/pages/DashboardPage.tsx` — REFACTOR: hub layout; remove stats/health/duplicate CTAs; optional continue-editing
- `frontend/src/pages/NotesListPage.tsx` — REFACTOR: list-only; expand panel; `?new=1`; create navigate with toast state
- `frontend/src/pages/NoteDetailPage.tsx` — REFACTOR: toast consume/clear; Saved toast; `last-note` write; Back to notes label
- `frontend/src/pages/SettingsPage.tsx` — EXTEND: `DeveloperInfo`
- `frontend/e2e/session.spec.ts` — update selectors if dashboard layout changes
- `frontend/e2e/notes-smoke.spec.ts` — add D1 smoke paths (recent order, create panel, toast)
- `frontend/e2e/notes-crud.spec.ts` — adapt list delete (⋯ menu) if covered
- `VERSION` — PATCH `0.4.2` → `0.4.3`
- `CHANGELOG.md` — ADR-009 UX refactor entry
- `_bmad-output/project-context.md` — frontend rules (hub/browse/work, sort util, toast, Developer info)
- `README.md` — brief note on Dashboard hub + expand create panel (optional)

## Tasks & Acceptance

### Phase 1 — Sort util + Dashboard hub

- [x] `frontend/src/utils/notesSort.ts` — implement `sortNotesForDisplay`: `updated_at` desc (null/invalid → `0`), then `id` desc
- [x] `frontend/src/components/RecentNotesList.tsx` — section “Recent notes”, up to 5 rows, `prefetchNote` on hover/focus, `data-testid="recent-notes"`
- [x] `frontend/src/pages/DashboardPage.tsx` — hub: tagline “Create and manage your notes”; remove stat cards, latest-note card, health block, “View all notes”; CTA → `/notes?new=1`; use sorted slice for recents

**Phase 1 acceptance:**
- Given notes with mixed `updated_at`, when Dashboard loads, then recent list order matches first five rows on `/notes` after same sort.
- Given zero notes, when Dashboard loads, then empty card CTA navigates to `/notes?new=1`.

### Phase 2 — Notes list-only + expand panel + `?new=1`

- [x] `frontend/src/components/ExpandableCreatePanel.tsx` — collapsible panel above list; wraps `NoteForm`; `data-testid="create-panel"`
- [x] `frontend/src/pages/NotesListPage.tsx` — remove `lg:grid-cols-2`; header “+ New note” toggles panel; read `new=1` → expand + reset + `replace` URL; default expanded when list empty else collapsed; pass sorted notes to `NoteList`

**Phase 2 acceptance:**
- Given notes exist, when user opens `/notes`, then create panel is collapsed and list is full width.
- Given `/notes?new=1`, when page mounts, then panel is expanded with empty form and URL becomes `/notes` without query.

### Phase 3 — Toast + form labels + mutation feedback

- [x] `frontend/src/components/Toast.tsx` — page-local; `role="status"` `aria-live="polite"`; ~3s dismiss
- [x] `frontend/src/components/NoteForm.tsx` — add `secondaryLabel` + `onSecondary`; remove hardcoded “New note”
- [x] `frontend/src/pages/NotesListPage.tsx` — create success: `navigate('/notes/:id', { state: { toast: 'Note created' } })`; panel `secondaryLabel="Cancel"` collapses + clears
- [x] `frontend/src/pages/NoteDetailPage.tsx` — on mount read `location.state.toast` → show Toast → `navigate` replace to clear state; `secondaryLabel="Back to notes"`; show “Saved” toast on successful `PUT`

**Phase 3 acceptance:**
- Given create succeeds on list, when detail loads, then toast “Note created” is visible (`data-testid="toast"`).
- Given save on detail, when `PUT` succeeds, then toast “Saved” appears.
- Given detail form, when secondary button clicked, then label reads “Back to notes” and navigates to `/notes`.

### Phase 4 — NoteListItem overflow delete

- [x] `frontend/src/components/NoteListItem.tsx` — row click → select; ⋯ menu → delete; `aria-label` on actions menu
- [x] `frontend/src/components/NoteList.tsx` — render `NoteListItem`; remove inline red Delete; empty copy for panel layout
- [x] `frontend/src/pages/NotesListPage.tsx` — on delete success, clear `last-note` when id matches

**Phase 4 acceptance:**
- Given a note row, when user opens ⋯ and confirms delete, then row is removed and user stays on `/notes`.
- Given `last-note` matches deleted id, when delete succeeds, then `last-note` is removed from `sessionStorage`.

### Phase 5 — Settings DeveloperInfo; remove health from Dashboard

- [x] `frontend/src/components/DeveloperInfo.tsx` — `<details>`/`<summary>` “Developer info”; `useHealthQuery` version display
- [x] `frontend/src/pages/SettingsPage.tsx` — render `DeveloperInfo` below username card
- [x] `frontend/src/pages/DashboardPage.tsx` — confirm no `useHealthQuery` import/render

**Phase 5 acceptance:**
- Given Settings page, when Developer info expanded, then API version from health is shown.
- Given Dashboard, when loaded, then no API version block is present.

### Phase 6 — Continue editing, E2E, docs, release

- [x] `frontend/src/utils/lastNote.ts` — `getLastNote()`, `setLastNote({ id, title })`, `clearLastNoteIfMatch(id)` with JSON parse guard
- [x] `frontend/src/pages/NoteDetailPage.tsx` — `setLastNote` on mount with note id + title
- [x] `frontend/src/pages/DashboardPage.tsx` — optional “Continue editing” link when `last-note` id exists in sorted list cache; title from storage with query fallback
- [x] `frontend/e2e/notes-smoke.spec.ts` — smoke: dashboard recent + create panel + toast selectors
- [x] `frontend/e2e/session.spec.ts` — update if dashboard assertions change
- [x] `VERSION` + `CHANGELOG.md` — PATCH bump to `0.4.3`
- [x] `_bmad-output/project-context.md` — document D1 UX patterns

**Phase 6 acceptance:**
- Given user opened a note on detail, when Dashboard loads, then “Continue editing” shows correct title (if note still exists).
- Given `npm run lint`, `npm run build`, and Playwright e2e in `frontend/`, when run after implementation, then all pass.

## Design Notes

**`sortNotesForDisplay` implementation** — parse helper:

```typescript
function noteSortTime(updated_at: string | null): number {
  if (!updated_at) return 0;
  const t = Date.parse(updated_at);
  return Number.isFinite(t) ? t : 0;
}
```

Notes without `updated_at` (or invalid ISO) sort after all dated notes; equal times tie-break by `id` desc.

**`NoteListItem` reuse** — `RecentNotesList` and `NoteList` both render `NoteListItem` with props: `showActions?: boolean` (false on dashboard), `onSelect`, `onDelete?`, `onPrefetch?`. Avoid duplicate row markup.

**Toast handoff** — `NotesListPage` passes `{ toast: 'Note created' }` in navigate state. `NoteDetailPage` uses `useEffect` on mount: if `location.state?.toast`, set local toast state, then `navigate(location.pathname, { replace: true, state: {} })` so refresh does not re-show toast. Do not show create toast on list page (unmounts immediately).

**`last-note` sessionStorage** — key `last-note`, value `JSON.stringify({ id: number, title: string })`. Parse failures → treat as absent. `clearLastNoteIfMatch(id)` called from list and detail delete `onSuccess`. Dashboard hides link when `!notes.some(n => n.id === id)` after sort.

**ExpandableCreatePanel** — page owns `expanded` + form state. Header “+ New note” toggles `expanded`. Cancel (`onSecondary`) sets `expanded=false`, resets form, clears field errors. When list becomes empty (after delete), auto-expand panel.

**Prefetch** — preserve ADR-007/008 `prefetchNote(queryClient, id)` on `NoteListItem` hover/focus for both list and recent rows.

**Scroll restoration** — unchanged: only `selectNote` saves `notes-list-scroll-y`; arriving from Dashboard `?new=1` has no saved key.

**E2E selector hygiene** — scope nav clicks to `header` with `exact: true` (lesson from ADR-008 Loop 3); use `data-testid` for `recent-notes`, `create-panel`, `toast`.

## Verification

**Commands:**
- `cd frontend && npm run lint` — expected: zero errors
- `cd frontend && npm run build` — expected: production build succeeds
- `cd frontend && npx playwright test` — expected: all e2e specs pass (API on :8000)

**Manual checks (pre-mortem signals):**
- Dashboard `recent-notes` first title matches first list row after sort
- Dashboard “New note” → `/notes` with expanded empty form, clean URL
- Create → detail with visible “Note created” toast
- API version only under Settings Developer info, not Dashboard

## Suggested Review Order

**Utilities**

- Shared sort with NaN/null guard
  [`notesSort.ts`](../../frontend/src/utils/notesSort.ts)

- `last-note` read/write/clear helpers
  [`lastNote.ts`](../../frontend/src/utils/lastNote.ts)

**New components**

- Toast a11y + auto-dismiss
  [`Toast.tsx`](../../frontend/src/components/Toast.tsx)

- Recent list + prefetch
  [`RecentNotesList.tsx`](../../frontend/src/components/RecentNotesList.tsx)

- Expand panel + Cancel behavior
  [`ExpandableCreatePanel.tsx`](../../frontend/src/components/ExpandableCreatePanel.tsx)

- Overflow delete row
  [`NoteListItem.tsx`](../../frontend/src/components/NoteListItem.tsx)

- Settings API version
  [`DeveloperInfo.tsx`](../../frontend/src/components/DeveloperInfo.tsx)

**Pages**

- Hub layout; no health; continue-editing
  [`DashboardPage.tsx`](../../frontend/src/pages/DashboardPage.tsx)

- List-only; `?new=1`; create navigate state
  [`NotesListPage.tsx`](../../frontend/src/pages/NotesListPage.tsx)

- Toast consume; Saved feedback; last-note write
  [`NoteDetailPage.tsx`](../../frontend/src/pages/NoteDetailPage.tsx)

- NoteForm secondary label prop
  [`NoteForm.tsx`](../../frontend/src/components/NoteForm.tsx)

**Tests & release**

- D1 smoke selectors
  [`notes-smoke.spec.ts`](../../frontend/e2e/notes-smoke.spec.ts)

- VERSION + CHANGELOG PATCH
  [`VERSION`](../../VERSION), [`CHANGELOG.md`](../../CHANGELOG.md)

## Spec Change Log

### Review loop 1 — 2026-06-05

- Code review (`bmad-code-review`): 5 patch, 3 defer, 11 dismissed. See Review Findings below.

## Review Findings

### Review loop 1 — 2026-06-05

- [x] [Review][Patch] Toast auto-dismiss timer resets on every `NoteDetailEditor` re-render [`frontend/src/pages/NoteDetailPage.tsx:89`] — fixed: `useCallback` for `dismissToast`
- [x] [Review][Patch] `continueTitle` queryClient / `"Note"` fallback chain unreachable [`frontend/src/pages/DashboardPage.tsx:29`] — fixed: truthy `||` chain per spec Design Notes
- [x] [Review][Patch] Dashboard notes query enabled without null-user guard [`frontend/src/pages/DashboardPage.tsx:15`] — fixed: `meQuery.isSuccess && meQuery.data != null`
- [x] [Review][Patch] `getLastNote` accepts non-positive `id` values [`frontend/src/utils/lastNote.ts:16`] — fixed: validate `id > 0`
- [x] [Review][Patch] Scroll-restore `requestAnimationFrame` not cancelled on unmount [`frontend/src/pages/NotesListPage.tsx:73`] — fixed: `cancelAnimationFrame` in effect cleanup
- [x] [Review][Defer] Background refetch may overwrite in-progress detail form edits [`frontend/src/pages/NoteDetailPage.tsx:31`] — deferred, pre-existing optimistic-update pattern; unsaved-changes warning out of scope v1
- [x] [Review][Defer] Second navigation with new toast state lost when same `noteId` [`frontend/src/pages/NoteDetailPage.tsx:159`] — deferred, rare re-navigation edge case
- [x] [Review][Defer] bfcache restoration may replay creation toast [`frontend/src/pages/NoteDetailPage.tsx:159`] — deferred, low-frequency browser back/forward scenario
