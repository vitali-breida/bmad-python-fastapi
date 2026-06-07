# ADR-010: Test coverage and quality policy

**Status:** Accepted — **implemented** (2026-06-07)  
**Date:** 2026-06-07  
**Scope:** Quantitative test-quality rules for backend coverage, e2e critical paths, per-epic test growth, and coverage delta limits. Applies to all future epics (P2, P3, and beyond). Does not replace epic Quality Gates — extends them.  
**Related:** ADR-004 (CI jobs), ADR-006 (E2E with API in CI), ADR-009 (e2e smoke selectors), Epic 9 retrospective (`epic-9-retro-2026-06-07.md`), `quality-gates.md`, `project-context.md`.  
**Discussion:** Epic 9 retrospective and follow-up — solo developer needs measurable quality guardrails as the project and idea backlog grow.

## Context

The project ships features through ADR → spec → implementation → `bmad-code-review` → Quality Gates. CI already runs pytest, lint, build, and Playwright on every push/PR to `main` (ADR-004). That is **automated regression** for whatever tests exist, but it does not guarantee:

| Gap | Risk as features accumulate |
|-----|------------------------------|
| No backend coverage floor | New API code merges with few or no tests while CI stays green |
| No explicit critical-path list | E2E exists (~15 scenarios) but “what must never break” is implicit |
| No per-epic test obligation | New user flows ship without new tests |
| No coverage delta tracking | Backend % can drift down several points per epic while staying above an eventual floor |

Epic 9 retrospective (2026-06-07) surfaced confusion between “run tests” and “maintain quality while growing functionality.” Backend line coverage measured **92%** on `app/` (28 pytest tests). Frontend line-coverage % was rejected as misleading for a React + Playwright stack.

**Prior state (ADR-004 CI baseline):** `python -m pytest` without coverage thresholds.

## Decision

Adopt a **four-rule Coverage policy**. Rules 1–2 are **CI-enforced**; Rules 3–4 are **epic sign-off** (recorded in each `spec-*.md`).

| Rule | Policy | Enforcement |
|------|--------|-------------|
| **1 — Backend floor** | Line coverage on `app/` **≥ 85%** | CI: `pytest --cov=app --cov-fail-under=85` |
| **2 — Critical paths** | **7/7** mandatory user flows have passing Playwright tests | CI e2e job; canonical list in `quality-gates.md` |
| **3 — Test delta** | Each epic adds tests proportional to new behavior (see table below) | Spec sign-off |
| **4 — Coverage delta** | Backend coverage drop per epic **≤ 2 percentage points** vs epic baseline, or explicit defer in `deferred-work.md` | Spec sign-off |

### Rule 1 — Backend floor (normative)

**Dependency:** `pytest-cov` in `requirements.txt`.

**Command (local and CI):**

```bash
python -m pytest --cov=app --cov-fail-under=85 --cov-report=term-missing
```

**CI change:** `.github/workflows/ci.yml` job `backend` uses the command above (replaces bare `pytest`).

**Scope:** `app/` package only. Migration scripts, `alembic/`, `tests/`, and `frontend/` are out of scope for this metric.

### Rule 2 — Critical paths (normative)

Mandatory e2e flows (must pass on every CI run):

| # | Flow | Spec file |
|---|------|-----------|
| 1 | Login → dashboard | `frontend/e2e/session.spec.ts` |
| 2 | Session refresh (valid token) | `frontend/e2e/session.spec.ts` |
| 3 | Invalid login shows error | `frontend/e2e/session.spec.ts` |
| 4 | Create note → detail + toast | `frontend/e2e/notes-smoke.spec.ts` |
| 5 | CRUD (create / update / delete) | `frontend/e2e/notes-crud.spec.ts` |
| 6 | Dashboard recent order = notes list | `frontend/e2e/notes-smoke.spec.ts` |
| 7 | Logout → login | `frontend/e2e/session.spec.ts` |

Removing or replacing a row requires an ADR amendment or a superseding ADR. Optional flows (scroll restoration e2e, Settings Developer info, overflow-delete-only paths) remain in `deferred-work.md` until promoted.

**Frontend line-coverage %:** explicitly **out of scope** — critical-path checklist + Playwright instead.

### Rule 3 — Test delta per epic (normative)

| Epic type | Min new pytest | Min new e2e |
|-----------|----------------|-------------|
| Frontend-only (e.g. P2 `?search=`, `returnUrl`) | 0 | **+1** per new user-visible flow |
| Backend + frontend (e.g. P3 tags, pinned) | **+3** | **+1** |
| Refactor, no UX change | 0 | 0 (all existing e2e must stay green) |

Every `spec-*.md` MUST include `Coverage baseline`, `Test delta (plan)`, and `Test delta (actual)` sections (templates in `quality-gates.md`).

### Rule 4 — Coverage delta (normative)

At epic **start**, record backend coverage % (Rule 1 command). At epic **sign-off**, record again.

```
delta = coverage_after − coverage_before
```

| delta | Action |
|-------|--------|
| 0% to −2% | Accept — record in spec (`Coverage after: X% (Δ Y%)`) |
| below −2% | Add pytest until delta ≥ −2% **or** document in `deferred-work.md` with reason and follow-up |
| below −85% absolute | CI blocks (Rule 1) |

**Project baseline at adoption (2026-06-07):** backend **92%**, pytest **28**, e2e **15**, critical paths **7/7**. Next epic uses its own baseline (typically prior epic’s `coverage_after`).

### Relationship to Quality Gates

ADR-010 **extends** the epic Definition of Done in `quality-gates.md`:

- Quality Gates (11 items) — planning, review, automation, docs, deferrals.
- Coverage sign-off (Rules 1–4) — quantitative test policy.

Both must be `[x]` before `status: done` on a spec.

### Process integration

| Phase | Coverage policy action |
|-------|------------------------|
| Epic start (ADR + spec) | Record `Coverage baseline` + `Test delta (plan)` |
| During development | Local Rule 1 + e2e; write tests per Rule 3 |
| Every push/PR | CI Rules 1–2 |
| Epic sign-off | `Test delta (actual)`, `Coverage after`, Coverage sign-off checkboxes |
| Epic retro | Carry forward new baseline; log defers |

**UX change order unchanged** (ADR-009 retro): `bmad-create-ux-design` → ADR → spec (with Quality Gates + Coverage baseline) → implementation → review.

### Rationale

- **85% floor** catches backend growth without tests; 92% current baseline leaves headroom.
- **7 critical paths** make regression scope explicit without chasing frontend line %.
- **Test delta** ties feature growth to test growth (especially P2/P3 on existing platform).
- **2% delta cap** prevents slow erosion across epics while Rule 1 still allows a hard floor.
- **CI + spec sign-off** split: machines enforce on every merge; human records epic-level obligations Rules 3–4.

### Rejected (for this ADR)

| Proposal | Reason |
|----------|--------|
| Single “80% whole repo” coverage target | Frontend distorts metric; backend-only scope is clearer |
| 100% line coverage on `app/` | Cost outweighs benefit for learning project |
| Manual full regression matrix each epic | Does not scale; CI + critical paths + delta sufficient |
| Vitest unit coverage for React (v1) | e2e critical paths chosen; add later if component tests requested |
| Automated Rule 4 in CI (baseline compare) | Deferred; manual spec sign-off sufficient for solo dev v1 |

## Implementation

| Artifact | Change |
|----------|--------|
| `requirements.txt` | `pytest-cov>=5.0.0,<6.0.0` |
| `.github/workflows/ci.yml` | `--cov=app --cov-fail-under=85` on backend job |
| `quality-gates.md` | § Coverage policy (canonical rules + templates) |
| `project-context.md` | Testing rules + workflow reference to ADR-010 |
| `README.md` | Tests and CI table mention coverage floor |

**Verification (2026-06-07):** `28 passed`, `app/` coverage **92%**, `--cov-fail-under=85` passes locally.

## Consequences

### Positive

- Measurable quality bar alongside feature velocity.
- P2/P3 epics extend ADR-008/009 platform without redoing foundation; tests must grow with features.
- Agents read `project-context.md` and include coverage sections in new specs automatically.

### Negative / trade-offs

- Backend-only metric ignores untested frontend branches (mitigated by Rule 2 e2e).
- Rule 4 is manual until optional CI baseline artifact is added.
- New backend epics must budget pytest work (Rule 3) or document defer.

## Compliance

- [x] ADR-010 accepted before treating policy as normative (this document).
- [x] `pytest-cov` in `requirements.txt`
- [x] CI backend job enforces ≥85%
- [x] `quality-gates.md` updated with Coverage policy
- [x] `project-context.md` references ADR-010
- [x] Local verification: 92% ≥ 85%

## Implementation status

| Item | Status | Notes |
|------|--------|-------|
| Rule 1 — CI coverage floor | **Done** | 2026-06-07 |
| Rule 2 — Critical path table | **Done** | 7/7 in `quality-gates.md` |
| Rule 3 — Test delta templates | **Done** | in `quality-gates.md` |
| Rule 4 — Delta sign-off process | **Done** | in `quality-gates.md` |
| Automated Rule 4 in CI | **Deferred** | optional follow-up |

## References

- Operational checklist: `_bmad-output/implementation-artifacts/quality-gates.md`
- Retro origin: `_bmad-output/implementation-artifacts/epic-9-retro-2026-06-07.md`
- CI workflow: `.github/workflows/ci.yml`
- E2E inventory: `_bmad-output/implementation-artifacts/tests/test-summary.md`
- Backlog levels (P2/P3): `_bmad-output/brainstorming/brainstorming-session-2026-06-05-1657.md`

## Review sign-off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Project Lead | Vitali | 2026-06-07 | Approved |
