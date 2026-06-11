# ADR-013: Visible Quality — Phase 3 (screen structure + bundle budget)

**Status:** Accepted  
**Date:** 2026-06-10  
**Scope:** `frontend/` + CI bundle check — **anchor-and-layer** screen structure and a **stable bundle-size gate**. **No route map, API contract, auth behavior, or backend changes.**  
**Related:** ADR-011 Phase 1 (visual + a11y), ADR-012 Phase 2 (README + architecture + security), ADR-008 (routing), ADR-009 (page roles), ADR-010 (coverage policy), `../brainstorming/brainstorming-session-2026-06-10-1200.md`.  
**Continues:** ADR-011 Visible Quality strategy — Phase 3 of 3.

## Context

Brainstorming (2026-06-10) and party-mode (2026-06-10) closed Phase 3 decisions:

| Choice | Vitali decision |
|--------|-----------------|
| **Perf evidence** | **Stable CI signal** — bundle budget after `vite build`, not Lighthouse as a blocking gate |
| **Craft spark** | **Screen structure** — progressive disclosure (anchor + one contextual layer), not motion-first or data-viz |
| **Dashboard** | **1A** — primary **New note** CTA dominates; recent notes are secondary |
| **Note detail** | **2B** — editor stays central; metadata and actions move to a **side panel** |

**Phase 1 (ADR-011):** design tokens + axe baseline (v0.4.9).  
**Phase 2 (ADR-012):** README + `docs/architecture.md` + `docs/security.md` (v0.4.10).

**Current UI gaps for Phase 3:**

| Gap | Impact |
|-----|--------|
| Dashboard CTA below recent list | Hub does not signal “start here” in first glance |
| Detail mixes editor + delete + timestamp in one column | No clear primary vs secondary structure |
| No bundle-size gate in CI | Perf quality dimension has no reproducible evidence |
| Expand/collapse patterns differ per screen | Structure feels ad hoc, not authored |

**Foundation is sufficient:** five routes, ADR-009 page roles, E2E, a11y baseline — no backend work required.

## Decision

| Area | Choice |
|------|--------|
| **Relationship to ADR-008/009** | **Extend** — same five routes and hub/browse/work roles. **Layout and information hierarchy only**; create/edit/delete behavior unchanged. |
| **Strategy** | **Visible Quality A+B** — Phase 3 pairs **craft** (anchor-and-layer structure) with **evidence** (bundle budget in CI). |
| **Spark name** | **Anchor & layer** — on each touched screen: one **anchor** block always visible; one **layer** for secondary context, revealed on demand. |
| **Dashboard anchor (1A)** | After greeting: **prominent New note CTA** (primary button, top of content). Recent notes list **below** anchor. “Continue editing” link stays muted/secondary. Empty state keeps CTA in card. |
| **Notes list layer** | Reuse and align **`ExpandableCreatePanel`** with shared disclosure primitive — create form is the layer; list + header are anchor. No new route. |
| **Detail layer (2B)** | **Side panel** (right on desktop; full-width sheet or drawer on narrow viewports) for **metadata and actions**: last updated, delete. **Editor** (title + body + save/back) stays in main column — never hidden behind collapse. Panel toggled via icon/button with `aria-expanded`. |
| **Settings layer** | Account card = anchor. **`DeveloperInfo`** = backstage layer (collapsible, distinct surface token) — align with shared disclosure primitive. |
| **Shared primitive** | New **`CollapsibleSection`** or **`SidePanel`** in `frontend/src/components/` — keyboard support, `aria-expanded`, CSS transition only (~200ms), `prefers-reduced-motion: reduce` disables animation. **No** animation libraries. |
| **Loading (optional slice)** | Row **skeleton** on **`NotesListPage`** only while notes load — perceived structure, not a second spark. Text “Loading…” on Dashboard may remain or use minimal skeleton; not required on Settings/Detail. |
| **Perf evidence** | **`scripts/check-bundle-budget.mjs`** (repo root or `frontend/scripts/`) runs after `npm run build`; reads gzip size of `frontend/dist/assets/*.js`; compares to limits in `frontend/package.json` `budgets` field (baseline captured at implementation start). **CI:** add step to `frontend` job in `.github/workflows/ci.yml` after `npm run build`. **Fail PR** if over limit. |
| **Lighthouse** | **Not** a blocking CI gate. Optional manual score in README/docs later — out of Phase 3 acceptance. |
| **New runtime npm deps** | **None** |
| **Backend** | **No changes** |
| **Product version bump** | **PATCH** (`0.4.10` → `0.4.11`) — user-visible layout change, no API break (ADR-006). |
| **Tests** | Existing 7/7 critical paths + a11y must stay green. **+1** e2e (expand side panel or disclosure + assert content visibility / `aria-expanded`) per ADR-010 Rule 3. |
| **Docs** | `CHANGELOG.md`; update `deferred-work.md` (Phase 3 → in progress/done); optional `frontend/docs/performance.md` or README bullet for bundle budget; `project-context.md` when shipped. |

### Out of scope (Phase 3)

- Card-stack hover physics on `NoteListItem` (**deferred** — motion layer, not structure)
- Lighthouse CI as blocking gate
- Dark mode, mobile nav redesign, hamburger shell
- New routes, API changes, auth/token storage changes
- Security headers, backend perf work
- Full-page transition animations between routes
- `eslint-plugin-jsx-a11y` (separate backlog)
- Resolving Phase 1 author craft gate as a **blocker** for Phase 3 ship (parallel tracks OK)

### Rejected (for this ADR)

| Proposal | Reason |
|----------|--------|
| Lighthouse blocking CI | User chose stable signal; flaky on preview/cold start |
| Motion-as-feedback as primary spark | User chose screen structure |
| Data-viz / chart accent on Dashboard | Perf + scope; not structure-first |
| Card-stack physics in Phase 3 | Deferred to post–Phase 3 backlog |
| Bundle budget + Lighthouse both blocking | One evidence channel per Visible Quality phase |
| Detail metadata in accordion above form | User chose side panel (2B) |

## Architecture

### Anchor & layer (normative)

```
Each touched screen:
  ANCHOR  — always visible (greeting + CTA, editor, account card, list header)
  LAYER   — one secondary surface, toggle open (create panel, side panel, developer info)
```

### Component touch map

```
frontend/
  scripts/check-bundle-budget.mjs     # NEW — gzip check vs package.json budgets
  package.json                      # budgets field + npm script check:budget
  src/components/CollapsibleSection.tsx   # NEW — shared disclosure
  src/components/SidePanel.tsx            # NEW (or CollapsibleSection variant) — detail metadata
  src/pages/DashboardPage.tsx       # REFACTOR — CTA above recent list (1A)
  src/pages/NotesListPage.tsx       # REFACTOR — anchor/layer alignment; optional skeleton
  src/components/ExpandableCreatePanel.tsx  # REFACTOR — use shared primitive
  src/pages/NoteDetailPage.tsx      # REFACTOR — editor main; side panel for meta/delete (2B)
  src/pages/SettingsPage.tsx        # REFACTOR — anchor/layer for DeveloperInfo
  src/components/DeveloperInfo.tsx  # REFACTOR — backstage layer styling
  e2e/disclosure.spec.ts            # NEW — panel expand + content visible
.github/workflows/ci.yml            # bundle step after build in frontend job
```

**Unchanged behavior:** routing, JWT, mutations, sort, toasts, `?new=1`, scroll restore, axe scope (login/dashboard/notes).

## Implementation phases

| Phase | Goal | Key files |
|-------|------|-----------|
| **1** | Bundle baseline + CI gate | `check-bundle-budget.mjs`, `package.json`, `ci.yml` |
| **2** | Shared disclosure primitives | `CollapsibleSection`, `SidePanel` |
| **3** | Screen structure (1A + 2B + list/settings) | `DashboardPage`, `NoteDetailPage`, `NotesListPage`, `ExpandableCreatePanel`, `SettingsPage`, `DeveloperInfo` |
| **4** | Tests + docs + release | `disclosure.spec.ts`, `VERSION`, `CHANGELOG`, `deferred-work.md` |

Detailed checklist: `../../implementation-artifacts/spec-adr-013-visible-quality-phase3.md`.

## Testing strategy

| Test | Expectation |
|------|-------------|
| Critical paths 7/7 | Unchanged — all green |
| `npm run test:a11y` | Unchanged — 0 critical violations |
| `npm run check:budget` (or equivalent) | Passes on main branch baseline |
| CI `frontend` job | lint + build + budget check green |
| New e2e | Side panel or disclosure opens; metadata/delete reachable; editor still visible |
| `prefers-reduced-motion` | Panel opens without required animation for a11y |

## Gate «достаточно» (Phase 3 complete)

- [ ] Dashboard shows **New note** CTA as primary action above recent list (1A)
- [ ] Detail editor in main column; metadata/delete in side panel (2B)
- [ ] Bundle budget CI step fails when limit exceeded
- [ ] Author approves structure feels intentional, not template accordion
- [ ] All Quality Gates in spec marked complete

## Consequences

### Positive

- **Third Visible Quality dimension** — structure (craft) + bundle gate (evidence)
- **Closes 3-phase brainstorming arc** — a11y, docs/security, structure/perf
- **Deterministic CI** — no Lighthouse flake
- **Reusable primitives** — cheaper future UX slices

### Negative / trade-offs

- Side panel adds responsive complexity (desktop vs narrow)
- Bundle limits need conscious updates when adding deps
- Structure-only spark may feel subtle vs motion — acceptable per user choice
- E2E must target content visibility, not animation timing

## Compliance

- [x] ADR-013 accepted before implementation starts (this document)
- [x] `npm run lint`, `npm run build`, `npm run check:budget`, `npm run test:e2e`, `npm run test:a11y` pass
- [x] VERSION + CHANGELOG PATCH bump on release
- [x] `deferred-work.md` Phase 3 status updated when shipped
- [x] `project-context.md` updated when shipped

## Implementation status

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Bundle baseline + CI | Done | Baseline ~92.6 KB gzip JS; limit 98 KB |
| 2 — Disclosure primitives | Done | `CollapsibleSection`, `SidePanel` |
| 3 — Screen structure | Done | 1A Dashboard, 2B Detail |
| 4 — Tests + release | Done | v0.4.11, `disclosure.spec.ts` |

## References

- Brainstorming: `_bmad-output/brainstorming/brainstorming-session-2026-06-10-1200.md`
- ADR-011 Phase 1: `adr-011-visible-quality-phase1.md`
- ADR-012 Phase 2: `adr-012-visible-quality-phase2.md`
- Party-mode decisions: 2026-06-10 (Winston, Sally, Amelia); user choices **1A**, **2B**, bundle CI

## Review sign-off

| Role | Name | Date | Approved / Changes requested |
|------|------|------|------------------------------|
| Architect | Vitali | 2026-06-10 | Approved |
