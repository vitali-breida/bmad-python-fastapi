# Validation Report — ADR-011 Visible Quality Phase 1

- **ADR:** `_bmad-output/planning-artifacts/adr/adr-011-visible-quality-phase1.md`
- **Spec:** `_bmad-output/implementation-artifacts/spec-adr-011-visible-quality-phase1.md`
- **Rubric:** bmad-prd PRD Quality Rubric (adapted for ADR + spec pair)
- **Run at:** 2026-06-10T11:20:00+00:00
- **Grade:** Fair — proceed after spec hygiene

## Overall verdict

ADR-011 is decision-ready and strategically coherent: it extends ADR-008/009 without route churn, names rejected alternatives, and pairs craft with axe evidence per the Visible Quality brainstorming thesis. The spec mirrors ADR phases with testable acceptance and correct ADR-010 test delta (+1 e2e).

Adversarial review surfaced predictable implementation gaps: axe scope is narrower than "accessibility baseline" language implies, the component code map omits high-touch files (`NoteForm`, `DeveloperInfo`), and spec lifecycle metadata (`status: draft`, empty coverage baseline) blocks a clean dev handoff. **Gate: implement after a short spec fix pass** — not a replan.

## Dimension verdicts

- Decision-readiness — **strong**
- Substance over theater — **adequate**
- Strategic coherence — **strong**
- Done-ness clarity — **adequate**
- Scope honesty — **adequate**
- Downstream usability — **thin**
- Shape fit — **strong**

## Findings by severity

### High (3)

**[Done-ness]** — Coverage baseline unfilled (spec § Coverage baseline)  
Rule 3–4 sign-off requires before/after numbers at epic start.  
*Fix:* Fill now: 92% backend, pytest 28, e2e 15 (per `quality-gates.md`).

**[Downstream usability]** — Spec status draft vs ADR accepted (spec frontmatter)  
ADR is Accepted; spec remains `draft` with `frozen-after-approval` block.  
*Fix:* Set spec `status: ready` after validation fixes.

**[Adversarial]** — NoteForm omitted from touch map (spec § Code Map)  
Heaviest indigo/gray usage in codebase; not listed in code map.  
*Fix:* Add to Phase 3 code map.

### Medium (5)

**[Substance]** — Axe scope vs "accessibility baseline" claim (ADR § A11y verification)  
Only `/login` and `/dashboard` scanned; notes flows have keyboard I/O but no axe.  
*Fix:* Narrow public language or add `/notes` to axe spec.

**[Done-ness]** — Incomplete component code map (spec § Code Map)  
`DeveloperInfo`, `RecentNotesList`, `Breadcrumbs` not listed.  
*Fix:* Add REFACTOR entries or explicit out-of-scope note.

**[Done-ness]** — Serious axe deferral underspecified (spec § Design Notes)  
*Fix:* Cap deferrals; require `deferred-work.md` entry + author sign-off.

**[Scope honesty]** — CI `test:a11y` vs `test:e2e` wording (ADR § A11y npm script)  
*Fix:* Clarify CI runs all e2e specs including `a11y.spec.ts`.

**[Adversarial]** — ADR-009 token line not superseded (ADR-009 § Visual system)  
*Fix:* Partial supersede note in ADR-011 Relationship row.

### Low (4)

- ADR-009 indigo conflict undocumented (ADR-011 § Decision) — one-line supersede note
- Subjective craft gate non-reproducible — intentional; document in gates
- `baseline_commit` empty — set at kickoff
- Sync `frontend/package.json` version on PATCH — add Phase 4 task

## Mechanical notes

- VERSION 0.4.8 → 0.4.9 PATCH aligns with ADR-006.
- CI `test:e2e` will pick up `a11y.spec.ts` automatically once added.
- E2e tests use `data-testid`, not color classes — low selector regression risk.
- `frontend/docs/` does not exist yet — expected.

## Reviewer files

- `review-rubric.md`
- `review-adversarial-general.md`

## Recommended pre-implementation fixes (≈15 min)

1. Fill coverage baseline in spec (92%, 28, 15, 7/7).
2. Set spec `status: ready`.
3. Extend code map: `NoteForm.tsx`, `DeveloperInfo.tsx`, `RecentNotesList.tsx`.
4. Add ADR-011 line: supersedes ADR-009 visual tokens only.
5. Clarify axe scope language in ADR gate + spec (login/dashboard v1).
