# ADR-009: Frontend Dashboard & Notes UX v2 — hub + list-only (D1)

**Status:** Accepted — **implemented** (2026-06-07)  
**Date:** 2026-06-05  
**Scope:** `frontend/` — refactor Dashboard and Notes pages for clear page roles (hub / browse / work). Layout, interaction, and feedback changes within the ADR-008 route map. Optional minor backend list ordering improvement.  
**Related:** ADR-008 (routing v1 — route map **unchanged**), ADR-007 (TanStack Query patterns — **reuse**), ADR-006 (version visibility), ADR-003 (JWT), `../ux-design-specification.md`, `../ux-design-directions.html`, `../brainstorming/brainstorming-session-2026-06-05-1657.md`.  
**Supersedes (partial):** ADR-008 § Dashboard blocks (stat cards, API version on home, duplicate CTAs), § Notes list layout (50/50 split + always-visible create column), § Dashboard “latest note” semantics, § Settings (adds Developer info section only).

## Context

ADR-008 shipped multi-page routing: `/dashboard`, `/notes`, `/notes/:id`, `/settings`. Implementation followed architectural goals but **UX page roles remain unclear**:

| Problem (current) | Impact |
|-------------------|--------|
| Dashboard shows stat cards + misleading “Latest note” (`notes[length-1]` by API `id` order) | Hub feels like a demo landing, not orientation |
| API version block on Dashboard duplicates footer `BuildInfo` | Dev noise on user home |
| Duplicate CTAs (“New note” + “View all notes”) | Cognitive clutter |
| Notes list uses `lg:grid-cols-2` (list + create side-by-side) | Split-view artifact from pre-routing SPA; row click navigates away, orphaning create column |
| Dashboard “New note” → `/notes` without fresh-form signal | Inconsistent create entry |
| Detail “New note” button navigates to list | Misleading label |
| Save/update gives no success feedback | User trust gap |
| Inline red Delete on list rows | Misclick risk |

**UX specification completed:** `_bmad-output/planning-artifacts/ux-design-specification.md` (Variant A, design direction **D1 — Expand Panel**, stakeholder confirmed).

**Design intent:** Dashboard = **hub**; Notes list = **browse** (+ on-demand create); Detail = **only edit surface**. Routes unchanged; behavior and layout change.

**Backend today:**

| Endpoint | Notes |
|----------|-------|
| `GET /notes` | Returns all notes; `store.list_notes` orders by `NoteRow.id` asc |
| `GET /notes/{id}`, CRUD | Unchanged |
| `GET /health`, `GET /auth/me` | Unchanged |

**Out of scope for this ADR:**

- Route map changes (no `/notes/new`, no post-login redirect change)
- Search/sort query params (`/notes?search=`) — backlog v2
- Unsaved-changes warning on detail — backlog v2
- Authz / `owner_id` on notes
- New npm UI libraries (MUI, shadcn, toast libraries) — custom lightweight `Toast`
- Mobile-first redesign, hamburger nav, bottom nav
- Full Playwright CRUD matrix rewrite (update smoke + new selectors only)

## Decision

| Area | Choice |
|------|--------|
| **Relationship to ADR-008** | **Extend**, do not replace routing. Same five routes, `ProtectedRoute`, `AppLayout`, session phases, scroll restoration, prefetch, Query hooks. |
| **Design direction** | **D1 — Expand Panel** (see `ux-design-directions.html`). |
| **Dashboard role** | **Hub** — greeting + tagline + **Recent notes (3–5)** + **single** primary CTA “New note”. Optional “Continue editing” link via `sessionStorage` `last-note` (`{ id, title }`). |
| **Dashboard — remove** | Stat card grid (“Total notes”), misleading “Latest note” card, API version block, duplicate secondary CTAs. |
| **Dashboard — empty state** | One card: short copy + primary CTA → `navigate('/notes?new=1')`. |
| **Recent notes sort** | **`sortNotesForDisplay(notes)`** — `updated_at` desc (null `updated_at` last among ties), then `id` desc. Shared by Dashboard (slice `[:5]`) and `NotesListPage` (full list). |
| **Sort location (v1)** | **Frontend util** `frontend/src/utils/notesSort.ts` — no backend change **required** for ADR-009 acceptance. |
| **Sort location (optional)** | Backend `list_notes` → `order_by(updated_at.desc().nulls_last(), id.desc())` in follow-up PR — improves OpenAPI/Swagger order; document in CHANGELOG if done. |
| **Notes list layout** | **List-only** — remove `lg:grid-cols-2`. Full-width note list. |
| **Create on list** | **`ExpandableCreatePanel`** above list — toggled by header “+ New note”. Wraps existing `NoteForm`. |
| **Create panel default** | **Expanded** when note list empty **or** on mount with `?new=1` query; **collapsed** when notes exist (default browse). |
| **Create query protocol** | Dashboard CTA → `navigate('/notes?new=1')`. On mount: read `new=1` → reset form, expand panel → `navigate('/notes', { replace: true })` to strip query. |
| **Post-create** | `POST /notes` success → `navigate('/notes/:id', { state: { toast: 'Note created' } })`. **Toast on destination page** — `NoteDetailPage` reads `location.state.toast` on mount, shows Toast, then `navigate` with `replace` to clear state (avoids unmounting toast mid-redirect). |
| **Note detail** | `NoteForm` `secondaryLabel="Back to notes"`; `onSecondary` → `navigate('/notes')`. Consumes `location.state.toast` on mount when arriving from create. |
| **NoteForm secondary button** | **REFACTOR (minor):** add `secondaryLabel` + `onSecondary` props (replace hardcoded “New note”). Detail: `"Back to notes"`. Create panel: `"Cancel"` — collapses panel + clears form (parent handler). |
| **Post-update** | Toast **“Saved”** on successful `PUT`. |
| **List delete affordance** | **`NoteListItem`** with **overflow menu (⋯)** → Delete → existing `ConfirmDialog`. Remove inline red Delete link from row. Clear `last-note` if deleted id matches. |
| **Detail delete** | Unchanged: header text link + `ConfirmDialog` → navigate `/notes`; clear `last-note` if deleted id matches. |
| **API version UI** | **Remove from Dashboard.** Add **`DeveloperInfo`** on `SettingsPage` — collapsible (`<details>`/`<summary>`), `useHealthQuery`, shows `version` from `GET /health`. Footer `BuildInfo` unchanged (product semver). |
| **Toast** | New **`Toast`** component — page-local state, fixed bottom-right, dark bg, ~3s auto-dismiss, `role="status"` `aria-live="polite"`. No new npm dependency. |
| **Continue editing** | Optional: on detail mount, `sessionStorage.setItem('last-note', JSON.stringify({ id, title }))`. Dashboard reads `last-note`; link text uses stored `title` (fallback: `queryClient.getQueryData(notesKeys.detail(id))?.title` or `"Note"`). **Clear** `last-note` when that note is deleted (detail or list). Hide link if id missing from sorted list cache. |
| **Visual system** | Tailwind utilities only (ADR UX spec § Design System Foundation). Reuse indigo/gray tokens. |
| **Product version bump** | **PATCH** (`0.4.2` → `0.4.3`) — user-visible UI change, no breaking API contract (ADR-006 pre-1.0 PATCH rules). |
| **Tests** | Update Playwright smoke for D1 layout; add/preserve `data-testid`: `recent-notes`, `create-panel`, `toast` where applicable. |
| **Docs** | Update `project-context.md` frontend rules when implementation ships; CHANGELOG entry. |

### Page specifications (target)

#### Dashboard (`/dashboard`)

```
Hello, {username}
Create and manage your notes          ← tagline

Recent notes                          ← 3–5 rows, sortNotesForDisplay.slice(0,5)
  • {title}    Updated {relative}
  ...

[ + New note ]                        ← navigate /notes?new=1

Continue editing: «{title}» →         ← optional, sessionStorage last-note { id, title }
```

Empty: single card + “Create your first note” → `/notes?new=1`.

#### Notes list (`/notes`)

```
Notes                    [ + New note ]   ← toggles ExpandableCreatePanel

[ ExpandableCreatePanel when open ]
  New note — NoteForm

[ NoteList — full width, NoteListItem rows with ⋯ ]
```

#### Note detail (`/notes/:id`)

Unchanged structure; copy/feedback changes only. **Back to notes** via `NoteForm.secondaryLabel`. **Toasts:** “Saved” on update; “Note created” from `location.state` after redirect from list create.

#### Settings (`/settings`)

Existing username + logout + **Developer info** (collapsed): API version from health.

### Rationale

- **UX spec as source of truth** — ADR-008 routing standup is done; next increment is **page role clarity** without another routing refactor.
- **D1 Expand Panel** — simpler than slide-over (D2); keeps create in document flow; teachable React state on `NotesListPage`.
- **Client-side sort util** — fixes Dashboard/list mismatch **without** mandating backend churn; optional backend sort is a one-line improvement later.
- **?new=1 protocol** — transient intent signal; stripped via `replace` avoids bookmark pollution.
- **Settings for API version** — preserves multi-query learning story (health hook) off the user home path.
- **PATCH semver** — UI/layout refactor; `/notes` JSON contract unchanged.

### Rejected (for this ADR)

| Proposal | Reason |
|----------|--------|
| D2 slide-over create | Stakeholder chose D1; more overlay/focus complexity |
| D3 compact hub (no recent) | Weak orientation; rejected in UX workflow |
| Post-login → `/notes` | ADR-008 decision stands; Dashboard remains home |
| `/notes/new` route | ADR-008 out of scope; expand panel + query sufficient |
| sonner / react-hot-toast | Avoid new deps; custom Toast per UX spec |
| Backend-only sort without frontend util | Dashboard slice still needs util; frontend util required either way |

## Architecture

### Component map (additions / changes)

```
frontend/src/
  utils/
    notesSort.ts              # NEW — sortNotesForDisplay()
  components/
    RecentNotesList.tsx       # NEW
    ExpandableCreatePanel.tsx # NEW — wraps NoteForm
    NoteListItem.tsx          # NEW — row + overflow delete
    Toast.tsx                 # NEW
    DeveloperInfo.tsx         # NEW
    NoteList.tsx              # REFACTOR — map NoteListItem
    NoteForm.tsx              # REFACTOR (minor) — secondaryLabel + onSecondary props
  pages/
    DashboardPage.tsx         # REFACTOR — hub layout
    NotesListPage.tsx         # REFACTOR — list-only + panel + ?new=1
    NoteDetailPage.tsx        # REFACTOR — labels + toast + last-note sessionStorage
    SettingsPage.tsx          # EXTEND — DeveloperInfo
```

**Unchanged:** `AppLayout`, `AppNav`, `ProtectedRoute`, `ConfirmDialog`, `Breadcrumbs`, `hooks/useNotes.ts` mutation logic (wire toast in pages or mutation callbacks).

### Data flow

```
/dashboard
  useMeQuery → greeting
  useNotesQuery → sortNotesForDisplay → slice(0,5) → RecentNotesList
  CTA → /notes?new=1

/notes
  useSearchParams or useLocation → new=1 → expand + reset + replace URL
  useNotesQuery → sortNotesForDisplay → NoteList
  ExpandableCreatePanel → useCreateNote → navigate /notes/:id with state { toast: 'Note created' }

/notes/:id
  location.state.toast on mount → show Toast → replace state (clear)
  useUpdateNote → toast Saved
  sessionStorage last-note { id, title } on mount; clear on delete of that id

/settings
  useHealthQuery → DeveloperInfo (collapsible)
```

### sortNotesForDisplay (normative)

```typescript
// Pseudocode — implement in notesSort.ts
function sortNotesForDisplay(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    const aTime = a.updated_at ? Date.parse(a.updated_at) : 0;
    const bTime = b.updated_at ? Date.parse(b.updated_at) : 0;
    if (bTime !== aTime) return bTime - aTime;
    return b.id - a.id; // desc by id when updated_at equal/null
  });
}
```

Dashboard: `sortNotesForDisplay(notes).slice(0, 5)`.  
Notes list: full sorted array.

## Implementation phases

| Phase | Goal | Key files |
|-------|------|-----------|
| **1** | Sort util + Dashboard hub | `notesSort.ts`, `RecentNotesList.tsx`, `DashboardPage.tsx` |
| **2** | Notes list-only + expand panel + `?new=1` | `ExpandableCreatePanel.tsx`, `NotesListPage.tsx` |
| **3** | Toast + detail labels + save/create feedback | `Toast.tsx`, `NoteForm.tsx`, `NotesListPage.tsx`, `NoteDetailPage.tsx` |
| **4** | NoteListItem overflow delete | `NoteListItem.tsx`, `NoteList.tsx` |
| **5** | Settings DeveloperInfo; remove health from Dashboard | `DeveloperInfo.tsx`, `SettingsPage.tsx` |
| **6** | Optional continue-editing; E2E + README + CHANGELOG + `project-context.md` | `frontend/e2e/`, docs |

Detailed checklist: `../../implementation-artifacts/spec-adr-009-dashboard-notes-ux-v2.md` (complete).

## Testing strategy

| Test | Expectation |
|------|-------------|
| Dashboard recent order | `recent-notes[0]` title matches first row on `/notes` after sort |
| Dashboard → New note | Lands on `/notes`, create panel open, empty form, URL has no `?new=1` |
| Create note | Redirect to `/notes/:id`; toast “Note created” **visible on detail page** (from `location.state`) |
| Update note | Toast “Saved” |
| List delete | ⋯ → Delete → confirm; row removed; stay on list |
| Detail delete | Confirm → `/notes` |
| Settings | Developer info shows health version; Dashboard does not |
| Scroll restore | Unchanged from ADR-008 |
| Playwright smoke | Login → dashboard → notes → detail paths with updated selectors |

## Consequences

### Positive

- Clear **hub / browse / work** roles — matches UX spec and teaching goals.
- Fixes misleading “latest note” and split-view confusion.
- Consistent sort between Dashboard and list.
- Save/create feedback closes trust loop.
- Safer list delete pattern.

### Negative / trade-offs

- Moderate refactor of three pages + new components — regression risk on create/edit/delete; phased PRs recommended.
- `?new=1` is a small URL contract — must strip via `replace` and test back navigation.
- Client-side sort does not fix API order for Swagger-only users until optional backend phase.
- Toast state is page-local — not global notification system (acceptable v1). Post-create uses `location.state` handoff so toast survives list → detail navigation.

## Compliance

- [x] ADR-009 accepted before implementation starts (this document).
- [x] UX spec acceptance criteria (pre-mortem signals) verified
- [x] `npm run lint`, `npm run build`, Playwright smoke pass
- [x] VERSION + CHANGELOG PATCH bump on release
- [x] `project-context.md` updated when shipped

## Implementation status

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Sort util + Dashboard hub | **Done** | 2026-06-07 |
| 2 — Notes list-only + expand panel + `?new=1` | **Done** | 2026-06-07 |
| 3 — Toast + detail labels + save/create feedback | **Done** | 2026-06-07 |
| 4 — NoteListItem overflow delete | **Done** | 2026-06-07 |
| 5 — Settings DeveloperInfo; remove health from Dashboard | **Done** | 2026-06-07 |
| 6 — Continue editing; E2E + README + CHANGELOG + `project-context.md` | **Done** | 2026-06-07 |

**v2 is complete only when all six rows are done.**

## References

- UX Design Specification: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Design mockups: `_bmad-output/planning-artifacts/ux-design-directions.html`
- ADR-008: `_bmad-output/planning-artifacts/adr/adr-008-frontend-routing-v1.md`
- ADR-006 versioning: PATCH for UI-only changes
- Current implementation: `frontend/src/pages/DashboardPage.tsx`, `NotesListPage.tsx`, `NoteDetailPage.tsx`

## Review sign-off

| Role | Name | Date | Approved / Changes requested |
|------|------|------|------------------------------|
| Architect | Vitali | 2026-06-05 | Approved |
| UX (Sally) | Vitali / spec author | 2026-06-05 | UX spec + D1 approved |
| Implementation | Vitali | 2026-06-07 | Approved |
