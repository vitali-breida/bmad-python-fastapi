# Adversarial Review — ADR-011 + Spec

**Artifacts:** ADR-011 Visible Quality Phase 1 + implementation spec  
**Stance:** Skeptical portfolio reviewer; assume gaps exist.

## Preamble

The pair reads polished — which is exactly when documents hide the holes that burn you mid-epic. Below are issues ordered by implementation pain, not politeness.

## Findings

- **[high]** Axe scans two pages; you claim "accessibility baseline" — Notes list has overflow delete menu, expand panel, and keyboard paths explicitly in I/O matrix but zero automated a11y coverage on `/notes` or `/notes/:id`. *Fix:* Add axe on `/notes` post-login or downgrade public language to "axe smoke on entry surfaces."

- **[high]** Code map omits `NoteForm.tsx` — the most indigo-heavy component (13 gray/indigo class hits). Phase 3 will either miss it or discover it ad hoc. *Fix:* Add to code map Phase 3.

- **[high]** `DeveloperInfo.tsx` on Settings uses gray utilities; Settings is in page touch map but child component is not. Token pass will look half-finished. *Fix:* List `DeveloperInfo.tsx` under Settings refactor.

- **[medium]** Serious axe violations can be deferred without a numeric cap — "fix or defer" is a loophole large enough to ship contrast failures. *Fix:* Cap deferrals; critical always blocks.

- **[medium]** Craft gate checkbox is the real definition of done for a "visual identity" epic — yet it sits buried in Phase 3 with no date discipline. *Fix:* Move to Quality Gates with required date before `status: done`.

- **[medium]** ADR-009 still says "Reuse indigo/gray tokens" in the accepted ADR chain — future readers will not know which ADR wins without archaeology. *Fix:* ADR-011 partial supersede note on ADR-009 visual line.

- **[medium]** `test:a11y` script is documented as CI path but CI only runs `test:e2e` — fine technically, misleading operationally for someone debugging CI failures. *Fix:* One sentence in spec Verification.

- **[medium]** No task to sync `frontend/package.json` `version` with root `VERSION` on PATCH — drift has happened before in monorepos. *Fix:* Explicit Phase 4 checkbox.

- **[low]** `RecentNotesList.tsx` and `Breadcrumbs.tsx` not in touch map — may retain indigo islands on Dashboard. *Fix:* Include or declare intentional legacy.

- **[low]** `eslint-plugin-jsx-a11y` deferred but no trigger for when to adopt — backlog item without entry condition. *Fix:* Add to `deferred-work.md`: "adopt when >3 manual a11y bugs found in review."

- **[low]** Spec `status: draft` after ADR acceptance — signals the author does not trust their own ADR sign-off. *Fix:* Promote spec status after this validation.

- **[low]** Coverage baseline blanks — you will forget the "before" numbers and Rule 4 becomes fiction. *Fix:* Fill now from quality-gates baseline table.
