---
title: 'ADR-011 Visible Quality — Phase 1 (visual identity + a11y baseline)'
type: 'feature'
created: '2026-06-10'
status: 'in-progress'
baseline_commit: 'a83e31eb133e5a1401c190357747ec5087ce547b'
context:
  - '{project-root}/_bmad-output/planning-artifacts/adr/adr-011-visible-quality-phase1.md'
  - '{project-root}/_bmad-output/brainstorming/brainstorming-session-2026-06-10-1200.md'
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app has solid infra (auth, CI, ADR, E2E) but the UI reads as generic tutorial CRUD. Portfolio reviewers cannot see **architect authorship**. Accessibility is not verified — the user's "production checklist" includes a11y but there is no evidence artifact.

**Approach:** Phase 1 of **Visible Quality** (brainstorming 2026-06-10): **craft** (design tokens + visual refresh on existing pages) + **evidence** (axe Playwright audit, `accessibility.md`). Extends ADR-008/009 — **no route or page-role changes**.

**Deferred (not this spec):**
- **Phase 2** — README rewrite + architecture diagram + security narrative (`deferred-work.md`)
- **Phase 3** — UI spark + performance budget (`deferred-work.md`)

## Boundaries & Constraints

**Always:** Keep route table and page roles from ADR-009. Tailwind utilities + `@theme` tokens only — no MUI/shadcn. Preserve `data-testid` hooks used by E2E. `Toast` keeps `role="status"` `aria-live="polite"`. Playwright host `127.0.0.1` unchanged.

**Ask First:** New routes; behavior changes to create/edit/delete flows; new runtime npm UI dependencies; CI job split.

**Never:** Backend changes for this epic; README full rewrite (Phase 2); Lighthouse CI (Phase 3); dark mode; mobile nav redesign.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login page visual | Unauthenticated `/login` | Centered card on warm background; clear heading; primary CTA styled via tokens | Errors unchanged (`role="alert"`) |
| Skip link | Tab from page load on protected route | "Skip to main content" visible on focus; activates `#main-content` | N/A |
| Focus visible | Keyboard tab through nav | Distinct `:focus-visible` ring on links, buttons, form fields | No `outline: none` without replacement |
| axe login | `a11y.spec.ts` on `/login` | 0 axe **critical** violations | Fail build; fix or defer in `deferred-work.md` with reason |
| axe dashboard | Authenticated `/dashboard` | 0 axe **critical** violations | Same |
| axe notes | Authenticated `/notes` | 0 axe **critical** violations | Same |
| Critical paths | Full e2e suite | 7/7 flows still pass | No selector regressions from class renames |
| Contrast | Primary button + body text | WCAG 2.1 AA (axe or manual) | Adjust token values |
| Session shells | Resolving / error states | Visual consistency with login shell | Behavior unchanged |
| ⋯ delete menu | Keyboard on list row | Menu openable; Escape closes | Existing ConfirmDialog focus trap preserved |

</frozen-after-approval>

## Code Map

- `frontend/src/index.css` — NEW: `@theme` design tokens + `@layer base` focus/body defaults
- `frontend/src/layouts/AppLayout.tsx` — skip link, `id="main-content"`, token-based shell
- `frontend/src/components/AppNav.tsx` — token nav + focus-visible
- `frontend/src/pages/LoginPage.tsx` — auth layout polish
- `frontend/src/components/LoginForm.tsx` — form card + button tokens
- `frontend/src/components/SessionShell.tsx` — match auth visual system
- `frontend/src/pages/DashboardPage.tsx` — typography/cards (roles unchanged)
- `frontend/src/components/RecentNotesList.tsx` — recent list row tokens
- `frontend/src/pages/NotesListPage.tsx` — header + CTA tokens
- `frontend/src/pages/NoteDetailPage.tsx` — detail surface tokens
- `frontend/src/components/NoteForm.tsx` — form fields + primary/secondary button tokens
- `frontend/src/pages/SettingsPage.tsx` — section cards
- `frontend/src/components/DeveloperInfo.tsx` — collapsible developer block tokens
- `frontend/src/components/Breadcrumbs.tsx` — crumb link tokens (if rendered)
- `frontend/src/components/NoteListItem.tsx` — row hover/focus/keyboard
- `frontend/src/components/ExpandableCreatePanel.tsx` — panel surface tokens
- `frontend/src/components/ConfirmDialog.tsx` — dialog surface + focus
- `frontend/src/components/Toast.tsx` — token colors (behavior unchanged)
- `frontend/src/components/BuildInfo.tsx` — footer muted text tokens
- `frontend/docs/accessibility.md` — NEW: scope, how to run axe, limitations
- `frontend/e2e/a11y.spec.ts` — NEW: axe on login, dashboard, notes
- `frontend/package.json` — devDep `@axe-core/playwright`; script `test:a11y`
- `VERSION` — PATCH `0.4.8` → `0.4.9`
- `CHANGELOG.md` — ADR-011 Phase 1 entry
- `_bmad-output/project-context.md` — design tokens + `test:a11y` rules
- `_bmad-output/implementation-artifacts/deferred-work.md` — Phases 2–3 backlog

## Tasks & Acceptance

### Phase 1 — Design tokens + base styles

- [x] `frontend/src/index.css` — define `@theme`: `--font-sans`, surface colors (bg, card, muted), accent + accent-foreground, text primary/muted, `--radius-card`, shadow token
- [x] `@layer base` — `body` background; global `:focus-visible` outline using accent ring; `color-scheme: light` only

**Phase 1 acceptance:**
- Given dev server, when any page loads, then shared CSS variables apply (inspect computed styles on `body` / card).
- Given keyboard user, when tabbing, then focus ring is visible on interactive elements using base or component styles.

### Phase 2 — Shell + auth visual refresh

- [x] `AppLayout.tsx` — warm muted page background; elevated header/footer; `main#main-content`
- [x] `AppLayout.tsx` — skip link: `sr-only` until `:focus-visible`, href `#main-content`
- [x] `AppNav.tsx` — migrate to semantic token classes; active nav state distinct
- [x] `LoginPage.tsx` + `LoginForm.tsx` — centered max-width card, page `<h1>`, primary button uses accent tokens
- [x] `SessionShell.tsx` — align loading/error panels with login card aesthetic

**Phase 2 acceptance:**
- Given `/login`, when page renders, then form is in a card on non-flat-gray background (visual review).
- Given protected page, when user tabs once from load, then skip link appears and Enter moves focus to main.

### Phase 3 — Pages + shared components visual pass

- [x] Dashboard, Notes list, Detail, Settings — page `<h1>`, section cards, primary/secondary buttons via tokens
- [x] `RecentNotesList`, `NoteForm`, `DeveloperInfo`, `Breadcrumbs` — token migration on touched surfaces
- [x] `NoteListItem`, `ExpandableCreatePanel`, `ConfirmDialog`, `Toast`, `BuildInfo` — token migration for surfaces, borders, hover
- [x] Remove remaining ad-hoc `indigo-*` / `gray-*` on touched files where semantic token exists

**Phase 3 acceptance:**
- Given signed-in flow login → dashboard → notes → detail, when visual review, then consistent card/radius/accent system (no mixed tutorial indigo islands).
- Given author sign-off checkbox below, when marked, then "pleasant to click" gate met.

**Author craft gate (manual):**
- [ ] **I enjoy opening the preview and want to click around** — Vitali, date: ___

### Phase 4 — A11y verification + docs + release

- [x] Add `@axe-core/playwright` devDependency
- [x] `package.json` script `"test:a11y": "playwright test e2e/a11y.spec.ts"`
- [x] `frontend/e2e/a11y.spec.ts` — axe scan `/login`; login as admin → axe scan `/dashboard` and `/notes`; assert 0 critical violations
- [x] Fix axe findings (contrast, labels, landmarks) or defer serious with entry in `deferred-work.md`
- [x] `frontend/docs/accessibility.md` — what pages scanned, command to run, keyboard spot-check notes, deferred items
- [x] `VERSION` + `CHANGELOG.md` PATCH `0.4.9`
- [x] `_bmad-output/project-context.md` — document `@theme` tokens + `npm run test:a11y`
- [x] ADR-011 implementation status table updated to Done

**Phase 4 acceptance:**
- Given `npm run test:a11y`, when run with API on :8000, then 0 critical axe violations.
- Given full `npm run test:e2e`, when run, then 7/7 critical paths still pass.

## Design Notes

**“Authored Warmth” direction** — warm off-white surfaces (`#faf9f7` family), card white, accent teal-slate (`#0d9488` / teal-600 class equivalent) with white button text meeting 4.5:1. Muted text warm gray, not cool gray-500 only. Subtle header border + `shadow-sm` on cards. Exact hex values live in `@theme` — adjust if axe contrast fails.

**Token naming (suggested):**

```css
@theme {
  --font-sans: ui-sans-serif, system-ui, sans-serif;
  --color-surface: #faf9f7;
  --color-surface-card: #ffffff;
  --color-surface-muted: #f3f1ec;
  --color-accent: #0d9488;
  --color-accent-foreground: #ffffff;
  --color-text: #1c1917;
  --color-text-muted: #57534e;
  --radius-card: 0.75rem;
}
```

Map to Tailwind utilities via `@theme` color names (`bg-surface`, `text-accent`, etc.) per Tailwind v4 docs.

**axe scope v1** — `/login`, `/dashboard`, `/notes`. `critical` violations fail; `serious` fix or defer with justification (entry in `deferred-work.md`). Run same `webServer` config as existing e2e.

**E2E selector hygiene** — prefer `data-testid` over CSS color classes; update only if layout structure changes.

**No behavior changes** — sorting, toasts, `?new=1`, delete flows, session expiry notice unchanged.

## Verification

**Commands:**
- `cd frontend && npm run lint` — zero errors
- `cd frontend && npm run build` — success
- `cd frontend && npm run test:e2e` — all specs pass incl. `a11y.spec.ts` (API :8000); this is what CI runs
- `cd frontend && npm run test:a11y` — 0 critical axe violations (local subset; same file as CI)
- `python -m pytest --cov=app --cov-fail-under=85` — unchanged (no backend delta)

**Manual checks:**
- Skip link keyboard path on `/dashboard`
- Login → notes → detail keyboard path (tab order sane)
- Author craft gate signed off

## Coverage baseline (epic start)

Canonical baseline per `_bmad-output/project-context.md` § Coverage policy (2026-06-07): backend **92%**, pytest **28**, e2e **15**, critical paths **7/7**. Re-measure at epic start only if that project baseline changes; record **Coverage after** in this spec at epic close.

## Test delta (plan)

| Type | Min new |
|------|---------|
| pytest | 0 |
| e2e | **+1** file (`a11y.spec.ts`) |

Epic type: **frontend-only** (ADR-010 Rule 3).

## Test delta (actual — epic sign-off)

| Type | Before | After | Delta | Plan met? |
|------|--------|-------|-------|-----------|
| pytest | 28 | 28 | 0 | [x] |
| e2e | 18 | 21 | +3 | [x] |

## Quality Gates

See canonical checklist: `_bmad-output/implementation-artifacts/quality-gates.md`

- [ ] UX/spec scope documented (explicit in / out of scope)
- [ ] All phase acceptance criteria marked complete in this spec
- [ ] `bmad-code-review` complete — 0 open Patch items (Defer → `deferred-work.md`)
- [ ] `python -m pytest --cov=app --cov-fail-under=85 --cov-report=term-missing` — pass (from project root)
- [ ] `cd frontend && npm run lint` — pass
- [ ] `cd frontend && npm run build` — pass
- [ ] `cd frontend && npm run test:e2e` — pass (API on :8000)
- [ ] Manual smoke from spec Verification section — pass (record date below)
- [ ] `project-context.md` updated if patterns changed
- [ ] `CHANGELOG.md` + `VERSION` bumped if user-visible release
- [ ] New deferrals added to `deferred-work.md` with reason
- [ ] Coverage policy sign-off (Rules 1–4) — see Coverage policy section below

**Manual smoke date:** 2026-06-10
**Reviewer / sign-off:** Vitali (agent implementation; craft gate pending human)
**Coverage after:** 92% (Δ 0% vs baseline)

### Coverage sign-off

- [ ] Rule 1: CI backend job green (≥85%)
- [ ] Rule 2: CI e2e job green (7/7 critical paths)
- [ ] Rule 3: Test delta (actual) ≥ plan (+1 e2e)
- [ ] Rule 4: coverage delta ≥ −2% or deferred in `deferred-work.md`

## Suggested Review Order

**Tokens & shell**

- Design tokens + focus defaults
  [`index.css`](../../frontend/src/index.css)

- Skip link + main landmark
  [`AppLayout.tsx`](../../frontend/src/layouts/AppLayout.tsx)

**Auth first impression**

- Login layout + form card
  [`LoginPage.tsx`](../../frontend/src/pages/LoginPage.tsx), [`LoginForm.tsx`](../../frontend/src/components/LoginForm.tsx)

**A11y evidence**

- axe e2e
  [`a11y.spec.ts`](../../frontend/e2e/a11y.spec.ts)

- Accessibility doc
  [`accessibility.md`](../../frontend/docs/accessibility.md)

## Spec Change Log

### Draft — 2026-06-10

- Initial spec from brainstorming session + ADR-011 acceptance.

### Ready — 2026-06-10 (post-validation)

- `status: ready`; coverage baseline references `project-context.md`.
- Code map: `RecentNotesList`, `NoteForm`, `DeveloperInfo`, `Breadcrumbs`.
- Axe scope extended to `/notes`; CI vs `test:a11y` clarified.
- ADR-011: partial supersede of ADR-009 visual palette (indigo → teal tokens).

### Done — 2026-06-10

- Implemented all four phases; v0.4.9; 21/21 e2e pass (incl. 3 axe tests).
- Author craft gate left for Vitali manual sign-off.

### Review Findings

- [x] [Review][Defer] Author craft gate pending — deferred: awaiting manual preview session before Vitali sign-off; Phase 3 checkbox remains unchecked until then.

- [x] [Review][Patch] deferred-work.md status contradicts release — fixed: Phase 1 marked complete (v0.4.9).

- [x] [Review][Patch] Skip-link target not focusable — fixed: `tabIndex={-1}` on `#main-content`.

- [x] [Review][Patch] Skip link uses `:focus` not `:focus-visible` — fixed: skip link classes use `focus-visible:` variants.

- [x] [Review][Patch] axe tests may run before content loads — fixed: wait for "Loading notes…" to clear before `analyze()`.

- [x] [Review][Patch] Escape closes menu without focus restore — fixed: `menuButtonRef` + focus restore on Escape.

- [x] [Review][Patch] shadow-card token unused — fixed: card surfaces migrated from `shadow-sm` to `shadow-card`.

- [x] [Review][Patch] Double focus indicators — fixed: `focus-visible:outline-none` on controls with explicit rings; global outline retained as fallback.

- [x] [Review][Defer] ConfirmDialog focus trap missing — `frontend/src/components/ConfirmDialog.tsx` — pre-existing; no focus trap, initial focus, or Escape handler; spec I/O matrix overstated "preserve."

- [x] [Review][Defer] axe scope limited to three routes — `frontend/e2e/a11y.spec.ts` — Detail/Settings/dialogs out of scope; documented in `frontend/docs/accessibility.md` limitations.

- [x] [Review][Defer] Serious axe violations not CI-enforced — `frontend/e2e/a11y.spec.ts` — tests filter `critical` only; matches spec Phase 4 AC; serious handled via manual/deferral policy.

- [x] [Review][Defer] Incomplete destructive/status token migration — touched files retain `red-*` / `amber-*` hardcoded colors; phased migration acceptable for Phase 1.

- [x] [Review][Defer] Toast inverted semantic tokens — `frontend/src/components/Toast.tsx` — uses `bg-text` / `text-surface-card`; works in light mode; dark mode deferred.

- [x] [Review][Defer] Breadcrumbs landmark semantics incomplete — `frontend/src/components/Breadcrumbs.tsx` — flat `nav` without `<ol>` / `aria-current="page"`.

- [x] [Review][Defer] Duplicated form input classes — `LoginForm.tsx` / `NoteForm.tsx` — `inputClass` duplicated verbatim; shared primitive deferred.

- [x] [Review][Defer] README pointer to accessibility doc omitted — ADR-011 optional one-line README link not added; `project-context.md` covers the script.

- [x] [Review][Defer] Note detail delete button polish skipped — `frontend/src/pages/NoteDetailPage.tsx` — delete CTA retains bare `text-red-600` without token/focus ring pass.

### Review Findings (round 2 — 2026-06-10)

- [x] [Review][Patch] accessibility.md overstates dialog behavior — fixed: dialog spot-check and limitations document ConfirmDialog gap.

- [x] [Review][Patch] Breadcrumb separator not hidden from AT — fixed: `aria-hidden="true"` on separator.

- [x] [Review][Patch] Multiple note action menus can stay open — fixed: `notes:close-action-menus` event closes other rows.

- [x] [Review][Patch] Tab order hits invisible menu backdrop — fixed: backdrop `tabIndex={-1}`; focus moves to delete menuitem on open.

- [x] [Review][Patch] Login axe test lacks hydration wait — fixed: wait for `login-app` before `analyze()`.

- [x] [Review][Defer] Author craft gate still unsigned — unchanged from round 1; blocks Phase 3 manual gate only.

- [x] [Review][Defer] ConfirmDialog focus trap — unchanged pre-existing gap; duplicate of round 1 defer.

- [x] [Review][Defer] Breadcrumbs `<ol>` / `aria-current` — unchanged from round 1 defer (separator fix is separate patch above).

- [x] [Review][Defer] axe scope / serious-only / token migration / Toast / README / note delete — duplicate deferrals; no regression from round 1 patches.
