---
title: 'ADR-013 Visible Quality — Phase 3 (screen structure + bundle budget)'
type: 'feature'
created: '2026-06-10'
status: 'done'
baseline_commit: '7216910ae7c14661752fcf2996bd365571ef61e4'
context:
  - '{project-root}/_bmad-output/planning-artifacts/adr/adr-013-visible-quality-phase3.md'
  - '{project-root}/_bmad-output/planning-artifacts/adr/adr-012-visible-quality-phase2.md'
  - '{project-root}/_bmad-output/planning-artifacts/adr/adr-011-visible-quality-phase1.md'
  - '{project-root}/_bmad-output/brainstorming/brainstorming-session-2026-06-10-1200.md'
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Phase 1–2 made the UI and docs credible, but screen hierarchy still feels ad hoc: Dashboard puts **New note** below the recent list; detail mixes editor, timestamp, and delete in one column; CI has no **stable perf evidence** for the frontend bundle.

**Approach:** Phase 3 of **Visible Quality** (party-mode 2026-06-10): **craft** (anchor-and-layer structure on existing routes) + **evidence** (gzip bundle budget in CI after `vite build`). Extends ADR-008/009 — **no route or API changes**.

**Vitali decisions (normative):**

| # | Choice | Meaning |
|---|--------|---------|
| Perf | Stable CI | Bundle size check — **not** Lighthouse blocking |
| Dashboard | **1A** | **New note** CTA is primary, above recent notes |
| Detail | **2B** | Editor in main column; metadata + delete in **side panel** |

**Deferred (not this spec):**

- Card-stack hover physics on `NoteListItem` (`deferred-work.md`)
- Lighthouse CI blocking gate
- Dark mode, mobile nav redesign, backend/security-header work
- Resolving ADR-011 author craft gate as a **ship blocker** for this epic

## Boundaries & Constraints

**Always:** Keep five routes and ADR-009 page roles (hub / browse / work). Tailwind + existing `@theme` tokens only — **no** animation libraries, **no** new runtime npm deps. Preserve `data-testid` hooks used by E2e. `Toast` keeps `role="status"`. Playwright host `127.0.0.1` unchanged. `prefers-reduced-motion: reduce` must still allow panel open (content visible without animation dependency).

**Ask First:** New routes; API changes; new runtime npm deps; Lighthouse in CI; expanding axe scope to detail/settings.

**Never:** Backend changes; auth/token storage changes; card-stack physics; full-page route transitions; deleting operator docs from README.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Dashboard with notes | Signed-in `/dashboard` | Greeting → **New note** button visible **before** recent list | Loading/error unchanged |
| Dashboard empty | No notes | CTA in empty-state card; still primary action | Same as today |
| Detail side panel closed | `/notes/:id` | Editor (title, body, save, back) fully usable | Delete not in main header row |
| Detail side panel open | Toggle info/actions control | Shows last updated + delete; `aria-expanded="true"` | Panel closes on toggle/Escape |
| Detail narrow viewport | Panel on small screen | Panel usable as sheet/drawer (full-width overlay OK) | Editor not permanently obscured |
| Notes list loading | `useNotesQuery` pending | Optional row skeletons OR existing loading text | No infinite skeleton |
| Bundle under limit | `npm run build` + `check:budget` | Exit 0 | N/A |
| Bundle over limit | Built assets exceed `package.json` budgets | Exit non-zero; CI frontend job fails | Document how to raise limit in PR |
| Critical paths | Full e2e suite | 7/7 flows still pass | Update selectors only if structure requires |
| axe baseline | `a11y.spec.ts` | 0 critical violations on login, dashboard, notes | Fix contrast/labels if panel changes landmarks |
| Create panel | `?new=1`, empty list | `ExpandableCreatePanel` still expands; behavior unchanged | Align markup with shared primitive |
| Delete flow | Open panel → delete | `ConfirmDialog` still works; delete reachable from panel | No keyboard trap regression (pre-existing gap may defer) |

</frozen-after-approval>

## Code Map

- `frontend/scripts/check-bundle-budget.mjs` — NEW: gzip sum of `dist/assets/*.js` vs limits
- `frontend/package.json` — `budgets` field + script `"check:budget"`
- `.github/workflows/ci.yml` — bundle step in `frontend` job after `npm run build`
- `frontend/src/components/CollapsibleSection.tsx` — NEW: disclosure primitive (`aria-expanded`, keyboard)
- `frontend/src/components/SidePanel.tsx` — NEW: right panel for detail metadata/actions
- `frontend/src/pages/DashboardPage.tsx` — REFACTOR: CTA block above `RecentNotesList` (1A)
- `frontend/src/pages/NoteDetailPage.tsx` — REFACTOR: editor main; side panel for updated_at + delete (2B)
- `frontend/src/pages/NotesListPage.tsx` — REFACTOR: anchor/layer layout; optional list skeleton
- `frontend/src/components/ExpandableCreatePanel.tsx` — REFACTOR: use `CollapsibleSection` patterns where applicable
- `frontend/src/pages/SettingsPage.tsx` — REFACTOR: account = anchor; developer block = layer
- `frontend/src/components/DeveloperInfo.tsx` — REFACTOR: backstage layer styling (may keep `<details>` or migrate to primitive)
- `frontend/e2e/disclosure.spec.ts` — NEW: side panel + content visibility
- `frontend/docs/performance.md` — NEW (optional): how bundle budget works, how to run locally
- `VERSION` — PATCH `0.4.10` → `0.4.11`
- `CHANGELOG.md` — ADR-013 Phase 3 entry
- `README.md` — optional one-line under Quality & security linking perf doc
- `_bmad-output/implementation-artifacts/deferred-work.md` — Phase 3 complete; card-stack remains deferred
- `_bmad-output/project-context.md` — bundle script + anchor/layer rules
- `_bmad-output/planning-artifacts/adr/adr-013-visible-quality-phase3.md` — implementation status at close

**Unchanged behavior:** routing, JWT, mutations, sort, toasts, `?new=1`, scroll restore, login/session flows.

## Tasks & Acceptance

**Naming:** This epic is **Visible Quality Phase 3** (ADR-013). Workstreams 1–4 are implementation order.

### Workstream 1 — Bundle baseline + CI gate

- [x] Run `npm run build` on `baseline_commit`; record total gzip KB of `dist/assets/*.js` entries — **baseline ~92.6 KB gzip**
- [x] Add `frontend/package.json` `"budgets"` — e.g. `totalJsGzipKb` with baseline + small headroom (~5% or documented cap) — **98 KB cap**
- [x] Implement `frontend/scripts/check-bundle-budget.mjs` — fail with clear message listing largest chunks if over limit
- [x] Add `"check:budget": "node scripts/check-bundle-budget.mjs"` (runs post-build; script assumes `dist/` exists)
- [x] `.github/workflows/ci.yml` — `npm run check:budget` after `npm run build` in `frontend` job

**Workstream 1 acceptance:**

- Given clean build on main baseline, when `npm run build && npm run check:budget`, then exit code 0.
- Given artificial limit below current size, when `check:budget` runs, then exit code non-zero and stdout names offending assets.

### Workstream 2 — Disclosure primitives

- [x] `CollapsibleSection.tsx` — title, toggle, `aria-expanded`, `aria-controls`, keyboard (Enter/Space), CSS transition with `@media (prefers-reduced-motion: reduce)` no-op
- [x] `SidePanel.tsx` — toggle button with `aria-label` (e.g. "Note details"); panel contains slot children; desktop: fixed width right column; narrow: overlay/sheet pattern
- [x] Export consistent surface tokens (`bg-surface-card`, borders) — no new colors outside `@theme`

**Workstream 2 acceptance:**

- Given keyboard user, when toggling section/panel, then focus order remains sane and panel content is reachable.
- Given `prefers-reduced-motion: reduce`, when panel opens, then content is visible without waiting on animation.

### Workstream 3 — Screen structure (1A + 2B + list/settings)

- [x] `DashboardPage.tsx` — move **New note** primary button to content area **immediately after** greeting/tagline, **above** `RecentNotesList`; keep "Continue editing" below list, muted
- [x] `NoteDetailPage.tsx` / `NoteDetailEditor` — remove inline delete link + timestamp from editor header row; place in `SidePanel`; editor `h1` + `NoteForm` remain in main column
- [x] `NotesListPage.tsx` — clarify anchor (page title + list) vs layer (create panel); align `ExpandableCreatePanel` wrapper with disclosure primitive styling
- [x] `SettingsPage.tsx` + `DeveloperInfo.tsx` — account card = anchor; developer block = distinct backstage layer (collapsible)
- [x] Optional: `NotesListPage` row skeleton (3–5 placeholders) while `loading` — no shimmer library

**Workstream 3 acceptance:**

- Given dashboard with ≥1 note, when page loads, then **New note** button appears **above** the recent notes list (DOM order or visual order — prefer DOM for a11y).
- Given note detail, when page loads, then title/body form visible without opening panel; when panel opened, then last updated text and delete action are inside panel.
- Given notes list `?new=1`, when navigated, then create panel still expands (regression vs ADR-009).

**Author craft gate (manual):**

- [ ] **Screen structure feels intentional, not a generic accordion** — Vitali, date: ___

### Workstream 4 — Tests + docs + release

- [x] `frontend/e2e/disclosure.spec.ts` — sign in → open note detail → toggle side panel → assert delete or updated text visible; assert editor still visible
- [x] `npm run test:e2e` — all specs green including new file (22/22)
- [x] `npm run test:a11y` — 0 critical violations (fix panel landmarks if axe flags)
- [x] `frontend/docs/performance.md` OR README bullet — how to run `check:budget`, what CI enforces
- [x] `VERSION` + `frontend/package.json` PATCH `0.4.11`
- [x] `CHANGELOG.md` — Phase 3 entry (structure + bundle gate)
- [x] `deferred-work.md` — Phase 3 → complete; card-stack stays deferred
- [x] ADR-013 implementation status table → Done
- [x] `project-context.md` — `check:budget` command; anchor/layer summary

**Workstream 4 acceptance:**

- Given full CI, when PR merges, then frontend job runs lint + build + check:budget.
- Given `disclosure.spec.ts`, when run with API on :8000, then panel toggle test passes.

## Design Notes

### Anchor & layer (simple rule)

On each touched screen:

- **Anchor** — always visible (greeting + CTA, editor, account card, list header)
- **Layer** — one extra block, open on demand (create panel, side panel, developer info)

### Dashboard layout (1A) — suggested DOM order

```
h1 Hello
p tagline
[ New note ]          ← primary CTA (anchor)
RecentNotesList       ← secondary
Continue editing link ← tertiary (if present)
```

### Detail layout (2B) — suggested structure

```
main column: breadcrumbs, h1 Edit note, NoteForm
side panel (toggle): Last updated, Delete note
```

Delete opens existing `ConfirmDialog` — behavior unchanged.

### Bundle budget (suggested)

```json
"budgets": {
  "totalJsGzipKb": <baseline + headroom>
}
```

Script sums gzip size of all `dist/assets/*.js` files. Log top 3 files on failure. No `size-limit` npm dep required unless implementer prefers it — plain Node `fs` + `zlib` is enough.

### E2E selector hygiene

- Add `data-testid="note-detail-panel"` and `data-testid="note-detail-panel-toggle"` on new controls
- Dashboard: existing `dashboard-app` + button name `/New note|Create your first note/`
- Do not assert animation timing — assert visibility and `aria-expanded`

### Epic type (ADR-010)

**Frontend-only epic with new verification flow** → Test delta: **0 pytest, +1 e2e file**.

## Verification

**Commands:**

- `cd frontend && npm run lint` — zero errors
- `cd frontend && npm run build` — success
- `cd frontend && npm run check:budget` — pass on baseline
- `cd frontend && npm run test:e2e` — all specs pass incl. `disclosure.spec.ts` (API :8000)
- `cd frontend && npm run test:a11y` — 0 critical axe violations
- `python -m pytest --cov=app --cov-fail-under=85` — unchanged (no backend delta)

**Manual checks:**

- Dashboard: CTA above list at first glance
- Detail: open/close side panel; delete still works
- Settings: developer info still expandable
- Author craft gate signed off

## Coverage baseline (epic start)

Canonical baseline at epic kickoff (`7216910a`, 2026-06-10): backend **~93%**, pytest **35**, e2e **21**, critical paths **7/7** (per `project-context.md` / ADR-012 closeout).

## Test delta (plan)

| Type | Min new |
|------|---------|
| pytest | 0 |
| e2e | **+1** file (`disclosure.spec.ts`) |

Epic type: **frontend-only** (ADR-010 Rule 3).

## Test delta (actual — epic sign-off)

| Type | Before | After | Delta | Plan met? |
|------|--------|-------|-------|-----------|
| pytest | 35 | 35 | 0 | [x] |
| e2e | 21 | 22 | +1 | [x] |

## Quality Gates

See canonical checklist: `_bmad-output/implementation-artifacts/quality-gates.md`

- [x] UX/spec scope documented (explicit in / out of scope)
- [x] All workstream acceptance criteria marked complete in this spec
- [x] `bmad-code-review` complete — 0 open Patch items (Defer → `deferred-work.md`)
- [x] `python -m pytest --cov=app --cov-fail-under=85 --cov-report=term-missing` — pass (from project root)
- [x] `cd frontend && npm run lint` — pass
- [x] `cd frontend && npm run build` — pass
- [x] `cd frontend && npm run check:budget` — pass
- [x] `cd frontend && npm run test:e2e` — pass (API on :8000)
- [x] `cd frontend && npm run test:a11y` — pass
- [ ] Manual smoke from spec Verification section — pass (record date below)
- [x] `project-context.md` updated if patterns changed
- [x] `CHANGELOG.md` + `VERSION` bumped if user-visible release
- [x] New deferrals added to `deferred-work.md` with reason
- [x] Coverage policy sign-off (Rules 1–4) — see below

**Manual smoke date:** ___
**Reviewer / sign-off:** ___
**Coverage after:** ___ (Δ vs baseline)

### Coverage sign-off

- [x] Rule 1: CI backend job green (≥85%) — local 93%
- [x] Rule 2: CI e2e job green (7/7 critical paths)
- [x] Rule 3: Test delta (actual) ≥ plan (+1 e2e)
- [x] Rule 4: coverage delta ≥ −2% or deferred in `deferred-work.md`

## Suggested Review Order

**Perf evidence**

- Bundle script + CI step
  [`check-bundle-budget.mjs`](../../frontend/scripts/check-bundle-budget.mjs), [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

**Structure (craft)**

- Dashboard CTA order (1A)
  [`DashboardPage.tsx`](../../frontend/src/pages/DashboardPage.tsx)

- Detail side panel (2B)
  [`NoteDetailPage.tsx`](../../frontend/src/pages/NoteDetailPage.tsx), [`SidePanel.tsx`](../../frontend/src/components/SidePanel.tsx)

**E2E evidence**

- Disclosure spec
  [`disclosure.spec.ts`](../../frontend/e2e/disclosure.spec.ts)

## Spec Change Log

### Ready — 2026-06-10

- Initial spec from ADR-013 + party-mode decisions (bundle CI, 1A Dashboard, 2B detail side panel).
- Frontend-only epic; +1 e2e; PATCH `0.4.11` on ship.
- Baseline commit `7216910a`; e2e 21, pytest 35.

### Implemented — 2026-06-10

- All four workstreams complete; status → `review`.
- Bundle baseline 92.6 KB gzip JS; cap 98 KB; post-implementation build ~90 KB gzip.
- e2e 22 (+1 `disclosure.spec.ts`); pytest 35 unchanged; backend coverage ~93%.

### Review Findings

- [x] [Review][Patch] E2E loading waiter stale after notes-list skeleton — fixed via `waitForNotesListLoaded` helper [`frontend/e2e/helpers/notes.ts`]
- [x] [Review][Patch] `openFirstNoteDetail` race during skeleton load — waits for load then scopes to `Notes list` region [`frontend/e2e/disclosure.spec.ts`]
- [x] [Review][Patch] Invalid `aria-controls` when side panel closed — panel stays in DOM with `hidden` [`frontend/src/components/SidePanel.tsx`]
- [x] [Review][Patch] Escape closes side panel while delete `ConfirmDialog` is open — skips close when `[role="dialog"]` present [`frontend/src/components/SidePanel.tsx`]
- [x] [Review][Patch] No e2e for Escape-to-close side panel — added tests in `disclosure.spec.ts`
- [x] [Review][Patch] No e2e for `/notes?new=1` deep link — added test in `disclosure.spec.ts`
- [x] [Review][Defer] Mobile sheet focus trap and body scroll lock not implemented — pre-existing dialog/focus-trap gap family; spec allows keyboard-trap deferral [`frontend/src/components/SidePanel.tsx:51-68`] — deferred, pre-existing
- [x] [Review][Defer] Note detail form state not resynced on background refetch — pre-existing pattern before ADR-013 [`frontend/src/pages/NoteDetailPage.tsx:34`] — deferred, pre-existing
