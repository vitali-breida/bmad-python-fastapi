# ADR + Spec Quality Review — ADR-011 Visible Quality Phase 1

**Artifacts reviewed:**
- `_bmad-output/planning-artifacts/adr/adr-011-visible-quality-phase1.md`
- `_bmad-output/implementation-artifacts/spec-adr-011-visible-quality-phase1.md`

**Rubric adapted from:** `bmad-prd` PRD Quality Rubric (seven dimensions applied to ADR + implementation spec pair)

## Overall verdict

ADR-011 is decision-ready and strategically coherent: it extends ADR-008/009 without route churn, names rejected alternatives, and pairs craft with axe evidence in a way that matches the brainstorming Visible Quality thesis. The spec mirrors ADR phases with testable acceptance criteria and correct ADR-010 test-delta (+1 e2e). **Implementation can proceed after a short spec hygiene pass** — fix spec `status`, fill coverage baseline at epic start, extend the code map to components that will inevitably be touched, and narrow or document the gap between "accessibility baseline" language and axe scope limited to login + dashboard.

## Decision-readiness — strong

The ADR decision table is explicit: tokens, accent migration, axe tooling, version bump, and out-of-scope items (dark mode, shadcn, Lighthouse) are stated as decisions, not suggestions. Rejected alternatives table gives honest trade-offs. Consequences section names regression risk on E2E selectors and subjective craft gate — not smoothed away.

### Findings
- **[low]** ADR-009 partial conflict undocumented (§ Decision / Visual system) — ADR-009 says "Reuse indigo/gray tokens"; ADR-011 migrates to teal accent. *Fix:* Add one line under Relationship: "Supersedes ADR-009 § Visual system (token palette only); page roles unchanged."

## Substance over theater — adequate

Content is earned for a portfolio/learning frontend-only epic. I/O matrix scenarios map to real flows (skip link, axe, critical paths). The "Authored Warmth" direction includes concrete hex suggestions in the spec Design Notes — not generic boilerplate.

### Findings
- **[medium]** "Accessibility baseline" framing vs narrow axe scope (ADR § A11y — verification; spec I/O matrix) — Notes list, detail, and Settings are visually in scope but not axe-scanned. Portfolio reviewers may over-read "verified a11y." *Fix:* Rename to "accessibility baseline (login + dashboard axe v1)" in ADR gate and `accessibility.md` scope section, or add `/notes` to axe spec.
- **[low]** Subjective craft gate is necessary but not reproducible (spec § Phase 3 Author craft gate) — acceptable for stated audience; document that it is intentional in `accessibility.md` or ADR consequences (already partially there).

## Strategic coherence — strong

Visible Quality A+B from brainstorming is traceable end-to-end: craft (tokens, shell) + evidence (axe, docs). Phase 2/3 correctly deferred to `deferred-work.md`. PATCH bump aligns with ADR-006 and current `VERSION` (0.4.8). No backend scope creep. ADR-010 Rule 3 (+1 e2e) correctly applied.

No material findings.

## Done-ness clarity — adequate

Four phased task lists with Given/When/Then acceptance blocks are implementable. Verification commands are complete. Quality Gates reference canonical `quality-gates.md`.

### Findings
- **[high]** Coverage baseline unfilled (spec § Coverage baseline) — `quality-gates.md` requires recording backend %, pytest count, e2e count at epic **start** before implementation. Placeholders `___` block Rule 3–4 sign-off later. *Fix:* Fill baseline now (project baseline: 92%, pytest 28, e2e 15 per quality-gates.md) or add explicit task "fill baseline before Phase 1."
- **[medium]** Incomplete component code map (spec § Code Map vs ADR § Component touch map) — `NoteForm.tsx`, `RecentNotesList.tsx`, `DeveloperInfo.tsx`, `Breadcrumbs.tsx` use indigo/gray heavily but are absent from both maps; Phase 3 says "remove indigo on touched files" without listing them. *Fix:* Add to code map with REFACTOR note, or explicitly mark out-of-scope with rationale.
- **[medium]** axe serious-violation deferral path underspecified (spec § Design Notes) — "serious fix or defer" lacks acceptance criterion for deferral (who approves, max count). *Fix:* One line: deferrals require `deferred-work.md` entry + author sign-off; zero critical, ≤2 serious deferred with justification.

## Scope honesty — adequate

ADR "Out of scope" and spec "Never" blocks are explicit and aligned. Deferred Phases 2–3 tracked in `deferred-work.md`. No silent README or backend expansion.

### Findings
- **[medium]** CI enforcement ambiguity (ADR § A11y — npm script) — ADR says `test:a11y` runs "local + CI via existing e2e job." CI runs `npm run test:e2e` (all specs), not `test:a11y`. Works once `a11y.spec.ts` exists under `e2e/`, but separate script is not invoked in `.github/workflows/ci.yml`. *Fix:* Clarify in spec Verification: "CI: included via `test:e2e` (all e2e specs); `test:a11y` is local convenience."

## Downstream usability — thin

ADR ↔ spec cross-links resolve. Phases align. But spec lifecycle metadata blocks clean handoff to `bmad-dev-story`.

### Findings
- **[high]** Spec status `draft` while ADR is Accepted (spec frontmatter `status: 'draft'` vs ADR `Status: Accepted — pending implementation`) — prior epics use `done` when complete; accepted ADRs pair with ready-to-implement spec status. *Fix:* Set spec `status: 'ready'` (or project convention `accepted`) when author intends implementation start; keep `draft` only if rework needed.
- **[medium]** `frozen-after-approval` block vs draft status (spec § Intent) — frozen section implies approved intent but frontmatter says draft. *Fix:* Align status with frozen marker after validation pass.
- **[low]** `baseline_commit` empty (spec frontmatter) — other done specs may record start commit. *Fix:* Set to current `main` SHA at implementation kickoff.

## Shape fit — strong

Correct artifact pairing for a brownfield frontend visual epic: ADR for decision, spec for phases/I/O/gates. Skipping separate UX spec is justified (styling only, no new flows). Quality Gates template correctly referenced.

No material findings.

## Mechanical notes

- ADR implementation status table: all Pending — expected pre-implementation.
- Spec links to `../../frontend/src/index.css` — file exists but is only `@import "tailwindcss";` (correct NEW state).
- `frontend/docs/` directory does not exist yet — expected per spec.
- E2e tests do not use color class selectors — low regression risk from token migration (good).
- `frontend/package.json` version mirrors root `VERSION` (0.4.8) — spec should mention syncing both on PATCH bump.
- ADR Review sign-off: Architect approved 2026-06-10; spec has no reviewer sign-off block filled.
