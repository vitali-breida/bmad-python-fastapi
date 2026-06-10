# ADR-011: Visible Quality — Phase 1 (visual identity + accessibility baseline)

**Status:** Accepted — **implemented** (Phase 1)  
**Date:** 2026-06-10  
**Scope:** `frontend/` — visual identity refresh and accessibility baseline. **No route map, page roles, or API contract changes** (extends ADR-008/009).  
**Related:** ADR-008 (routing), ADR-009 (UX page roles), ADR-006 (versioning), ADR-010 (coverage policy), `../brainstorming/brainstorming-session-2026-06-10-1200.md`.  
**Supersedes (partial):** ADR-009 § Visual system (indigo/gray utilities → teal `@theme` tokens); page roles and flows unchanged.

## Context

Brainstorming (2026-06-10) identified a **Visible Quality** strategy: each increment ships something **showable** (craft) and **verifiable** (evidence). Audience: learning + portfolio — not end-user product value yet.

**Phase 1 (this ADR):** visual refresh + interaction polish + accessibility baseline.  
**Phase 2 (deferred):** README rewrite + architecture diagram + security narrative.  
**Phase 3 (deferred):** distinctive UI spark + performance budget.

**Current UI gaps:**

| Gap | Impact |
|-----|--------|
| Generic gray/indigo Tailwind defaults | Reads as tutorial CRUD, not authored design |
| No shared design tokens | Inconsistent spacing, radii, focus treatment |
| A11y not verified | Portfolio “production checklist” incomplete for accessibility |
| Login / shell lack visual identity | Weak first impression for preview reviewers |

**Foundation is sufficient:** auth, CI, ADR chain, E2E, migrations — no backend work required for Phase 1.

**UX scope:** Shortened UX direction embedded in this ADR (no separate `ux-design-specification.md` for Phase 1 — styling and a11y only, no new flows).

## Decision

| Area | Choice |
|------|--------|
| **Relationship to ADR-008/009** | **Extend** — same five routes, hub/browse/work roles, Query hooks, toasts, expand panel, scroll restoration. **Behavior unchanged** unless required for a11y (labels, focus order). **Supersedes ADR-009 visual palette only** (indigo/gray → semantic teal tokens). |
| **Strategy** | **Visible Quality A+B** — Phase 1 pairs **craft** (visual identity) with **evidence** (axe audit + documented a11y fixes). |
| **Design direction** | **“Authored Warmth”** — warm neutral surfaces, one refined accent, card-based hierarchy, subtle depth (shadow/border), intentional typography scale. Distinct from default Vite/indigo tutorial look while staying Tailwind-only. |
| **Design tokens** | Tailwind v4 `@theme` in `frontend/src/index.css` — CSS variables for `--color-surface`, `--color-accent`, `--color-text`, `--radius-card`, `--shadow-card`, `--font-sans`. Components migrate from ad-hoc `gray-*` / `indigo-*` to semantic utilities (`bg-surface`, `text-accent`, etc.) where touched. |
| **Typography** | System font stack (`font-sans` theme); clear page title / section / body scale. No new npm font packages in v1. |
| **Accent color** | Move primary accent from default indigo-600 pattern to theme **accent** (teal-slate family — exact hex in spec implementation). WCAG AA contrast required for text on accent backgrounds. |
| **Layout shell** | `AppLayout` + `LoginPage` shell — refined background (subtle gradient or warm `bg-surface-muted`), header/footer cards or elevated bar, consistent `max-w-5xl` content rhythm. |
| **Interaction polish** | Visible `:focus-visible` rings on all interactive elements; consistent hover/active on buttons and nav; subtle `transition-colors` on primary controls (no layout-shifting animation). |
| **Components in scope** | `AppLayout`, `AppNav`, `LoginPage` / `LoginForm`, `SessionShell`, page titles on Dashboard/Notes/Settings/Detail, `RecentNotesList`, `NoteForm`, `DeveloperInfo`, `Breadcrumbs`, shared patterns: primary/secondary buttons, cards, `NoteListItem`, `ExpandableCreatePanel`, `ConfirmDialog`, `Toast`, `BuildInfo`. |
| **A11y — keyboard** | Logical tab order on login + protected shell; no keyboard traps in dialogs; ⋯ menu operable via keyboard (Enter/Space, Escape). |
| **A11y — skip link** | **Skip to main content** link in `AppLayout` — visually hidden until focused, targets `<main id="main-content">`. |
| **A11y — semantics** | One `<h1>` per page; form fields retain labels; icon-only controls have `aria-label`; live regions unchanged (`Toast` keeps `role="status"`). |
| **A11y — contrast** | Text and UI controls meet **WCAG 2.1 AA** (4.5:1 normal text, 3:1 large/UI). Document token choices in spec. |
| **A11y — verification** | `@axe-core/playwright` devDependency; new e2e `frontend/e2e/a11y.spec.ts` runs axe on `/login` (unauthenticated), `/dashboard` and `/notes` (authenticated). **Zero critical violations** at epic close; serious violations fixed or documented deferral. |
| **A11y — npm script** | `npm run test:a11y` → `playwright test e2e/a11y.spec.ts` (local convenience). **CI** runs `npm run test:e2e`, which includes `a11y.spec.ts` with all other e2e specs. |
| **A11y doc artifact** | Short `frontend/docs/accessibility.md` — what was checked, how to run axe, known limitations (deferred). |
| **New UI npm deps** | **Only** `@axe-core/playwright` (dev). No component libraries, icon packs, or font packages. |
| **Backend** | **No changes** |
| **Product version bump** | **PATCH** (`0.4.8` → `0.4.9`) — user-visible UI change, no API break (ADR-006). |
| **Tests** | Existing 7/7 critical paths must stay green. **+1** e2e file (`a11y.spec.ts`) per ADR-010 Rule 3 (frontend epic with new verification flow). |
| **Docs** | `project-context.md` frontend rules (design tokens, a11y script); optional one-line README pointer to `frontend/docs/accessibility.md`. |

### Out of scope (Phase 1)

- Route map or page role changes
- README rewrite, architecture diagram, security narrative (**Phase 2**)
- Performance budget / Lighthouse CI (**Phase 3**)
- Distinctive motion/spark feature (**Phase 3**)
- Mobile-first redesign, hamburger nav
- Dark mode theme
- `eslint-plugin-jsx-a11y` (optional follow-up — axe e2e is sufficient v1)
- Full manual keyboard audit of every edge case (axe + spot-check login → notes → detail)

### Rejected (for this ADR)

| Proposal | Reason |
|----------|--------|
| shadcn / MUI / Radix | Avoid UI framework lock-in; Tailwind tokens sufficient |
| README phase bundled here | Brainstorming split — README is Phase 2 craft |
| Lighthouse perf in Phase 1 | Phase 3 evidence slice; avoid scope creep |
| Backend security headers | Phase 2 security narrative |

## Architecture

### Token layer

```
frontend/src/index.css
  @import "tailwindcss"
  @theme { --color-*, --radius-*, --font-sans, ... }
  @layer base { focus-visible defaults, body bg }
```

### Component touch map

```
frontend/src/
  index.css                    # NEW — @theme tokens + base styles
  layouts/AppLayout.tsx        # REFACTOR — shell, skip link, main id
  components/AppNav.tsx        # REFACTOR — token-based nav + focus
  components/LoginForm.tsx     # REFACTOR — card form styling
  components/SessionShell.tsx  # REFACTOR — match login shell
  pages/LoginPage.tsx          # REFACTOR — centered auth layout
  pages/DashboardPage.tsx      # REFACTOR — typography/cards (no role change)
  components/RecentNotesList.tsx # REFACTOR — list row tokens
  pages/NotesListPage.tsx      # REFACTOR — header/button tokens
  pages/NoteDetailPage.tsx     # REFACTOR — typography/cards
  components/NoteForm.tsx      # REFACTOR — form fields + button tokens
  pages/SettingsPage.tsx       # REFACTOR — card sections
  components/DeveloperInfo.tsx # REFACTOR — settings collapsible tokens
  components/Breadcrumbs.tsx   # REFACTOR — nav crumb tokens (if rendered)
  components/NoteListItem.tsx  # REFACTOR — row hover/focus
  components/ExpandableCreatePanel.tsx
  components/ConfirmDialog.tsx
  components/Toast.tsx
  components/BuildInfo.tsx
  docs/accessibility.md        # NEW
  e2e/a11y.spec.ts             # NEW — axe on login, dashboard, notes
```

**Unchanged behavior:** routing, auth, mutations, sort, toasts, `?new=1`, scroll restore, Developer info.

## Implementation phases

| Phase | Goal | Key files |
|-------|------|-----------|
| **1** | Design tokens + global base styles | `index.css` |
| **2** | Shell + auth visual refresh | `AppLayout`, `AppNav`, `LoginPage`, `LoginForm`, `SessionShell` |
| **3** | Page + shared component visual pass | pages, `NoteListItem`, panels, dialogs, `Toast` |
| **4** | A11y fixes + axe e2e + docs + release | skip link, contrast, `a11y.spec.ts`, `accessibility.md`, VERSION |

Detailed checklist: `../../implementation-artifacts/spec-adr-011-visible-quality-phase1.md`.

## Testing strategy

| Test | Expectation |
|------|-------------|
| Critical paths 7/7 | Unchanged — all green |
| `npm run test:a11y` | axe: 0 critical violations on login, dashboard, notes |
| Manual keyboard | Tab through login → dashboard → notes link; skip link focuses main |
| Contrast spot-check | Primary buttons and body text pass AA (DevTools or axe) |
| Visual gate (author) | Preview “pleasant to click” — subjective sign-off in spec |

## Gate «достаточно» (Phase 1 complete)

- [ ] Author approves opening preview (subjective craft gate)
- [ ] axe e2e passes with 0 critical violations
- [ ] `frontend/docs/accessibility.md` documents scope + how to run
- [ ] All Quality Gates in spec marked complete

## Consequences

### Positive

- **Authorship signal** — UI looks intentional for portfolio review
- **First verified quality dimension** — accessibility with reproducible axe artifact
- **Token foundation** — Phase 2/3 visual work cheaper
- **No backend risk** — frontend-only increment

### Negative / trade-offs

- Broad CSS touch surface — regression risk on E2E selectors; run full Playwright suite
- Subjective “pleasant design” — author sign-off required; not fully automatable
- axe does not catch all a11y issues — manual keyboard spot-check still needed
- Accent migration may require updating many class strings in one epic

## Compliance

- [x] ADR-011 accepted before implementation starts (this document)
- [ ] `npm run lint`, `npm run build`, `npm run test:e2e`, `npm run test:a11y` pass
- [ ] VERSION + CHANGELOG PATCH bump on release
- [ ] `project-context.md` updated when shipped
- [ ] Phases 2–3 tracked in `deferred-work.md`

## Implementation status

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Design tokens + base styles | **Done** | `@theme` in `index.css` |
| 2 — Shell + auth visual refresh | **Done** | skip link, login card |
| 3 — Page + component visual pass | **Done** | teal tokens |
| 4 — A11y + axe e2e + docs + release | **Done** | `a11y.spec.ts`, v0.4.9 |

## References

- Brainstorming: `_bmad-output/brainstorming/brainstorming-session-2026-06-10-1200.md`
- ADR-009: `_bmad-output/planning-artifacts/adr/adr-009-frontend-dashboard-notes-ux-v2.md`
- ADR-010 coverage: frontend-only epic → +1 e2e minimum
- Spec: `_bmad-output/implementation-artifacts/spec-adr-011-visible-quality-phase1.md`

## Review sign-off

| Role | Name | Date | Approved / Changes requested |
|------|------|------|------------------------------|
| Architect | Vitali | 2026-06-10 | Approved |
