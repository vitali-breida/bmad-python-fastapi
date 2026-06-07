# Quality Gates — Epic Definition of Done

Canonical checklist for closing any implementation epic (ADR + spec).  
**Do not copy manually** — reference this file from every new spec (`## Quality Gates` section).

**ADR:** `_bmad-output/planning-artifacts/adr/adr-010-test-coverage-and-quality-policy.md`  
**Retro origin:** Epic 9 retrospective (2026-06-07).

---

## When to use

Apply at **epic sign-off** (all implementation phases complete).  
Individual phases still use phase-specific acceptance in the spec; this checklist covers **cross-cutting quality**.

---

## Quality layers (why one review is not enough)

| Layer | Question answered | Typical artifact |
|-------|-------------------|------------------|
| 1. Planning | Is the decision and scope right? | UX spec, ADR, spec I/O matrix |
| 2. Implementation | Did each phase meet acceptance? | Phase checklists in spec |
| 3. Review | Is the code correct and safe? | `bmad-code-review` loops |
| 4. Automation | Do tests and build pass? | pytest, lint, build, e2e |
| 5. Release | Is it shippable; what is deferred? | Manual smoke, `deferred-work.md` |

---

## Epic Definition of Done

Copy this block into every new `spec-*.md` as `## Quality Gates`:

```
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

**Manual smoke date:** _YYYY-MM-DD_
**Reviewer / sign-off:** _
**Coverage after:** ___% (Δ ___% vs baseline)
```

---

## Code review guidance

| Epic size | Recommended review |
|-----------|-------------------|
| ≤ 6 phases, solo dev | 1 review after all phases; 2nd loop only for open Patch |
| Backend + frontend (e.g. tags) | 1 review after backend, 1 after frontend |
| Single-file fix | Review optional; automation gates still required |

**Rule:** Code review does not replace e2e. Run Playwright before marking gates complete.

---

## UX change workflow (order)

When user-visible behavior changes:

1. `bmad-create-ux-design` (full or shortened scope)
2. ADR — decision + scope block (“extends X, does not replace routes”)
3. Implementation spec — phases + I/O matrix + **Quality Gates** (above)
4. `bmad-dev-story` / implementation
5. `bmad-code-review` + automation gates

Skip UX only for refactors with **no** behavior change for the user.

---

## P2 / P3 backlog (additive, not rewrite)

Levels from brainstorming are **feature depth**, not a new app generation:

- **P0 / Level 1** — routing foundation (ADR-008) ✅
- **P1** — e2e quick win ✅
- **ADR-009** — UX page roles ✅
- **P2 / Level 2** — `?search=`, `returnUrl` — extends existing routes
- **P3 / Level 3** — tags, pinned — new backend + UI on existing pages

Prior epics are **platform**; P2/P3 are **features on the platform**. No route-map rewrite required.

---

## Coverage policy (4 rules)

Adopted 2026-06-07. Normative decision: **ADR-010**. Integrates with epic sign-off; see `epic-9-retro-2026-06-07.md`.

| # | Rule | Enforced by | When |
|---|------|-------------|------|
| 1 | Backend line coverage on `app/` **≥ 85%** | CI (`--cov-fail-under=85`) | every push/PR |
| 2 | **7/7** mandatory critical-path e2e scenarios pass | CI e2e job | every push/PR |
| 3 | **+N tests per epic** (see Test delta table) | spec sign-off | epic close |
| 4 | Coverage drop **≤ 2%** vs epic baseline, or defer | spec sign-off + `deferred-work.md` | epic close |

**Project baseline (2026-06-07):** backend **92%**, pytest **28**, e2e **15**, critical paths **7/7**.

### Rule 1 — Backend floor (automated)

```bash
python -m pytest --cov=app --cov-fail-under=85 --cov-report=term-missing
```

CI runs this on job `backend`. Fails if `app/` drops below 85%.

### Rule 2 — Critical paths (automated e2e + checklist)

Mandatory user flows — each must have a passing Playwright test:

| # | Flow | Spec file |
|---|------|-----------|
| 1 | Login → dashboard | `frontend/e2e/session.spec.ts` |
| 2 | Session refresh (valid token) | `frontend/e2e/session.spec.ts` |
| 3 | Invalid login shows error | `frontend/e2e/session.spec.ts` |
| 4 | Create note → detail + toast | `frontend/e2e/notes-smoke.spec.ts` |
| 5 | CRUD (create / update / delete) | `frontend/e2e/notes-crud.spec.ts` |
| 6 | Dashboard recent order = notes list | `frontend/e2e/notes-smoke.spec.ts` |
| 7 | Logout → login | `frontend/e2e/session.spec.ts` |

CI job `e2e` runs all specs. Do not remove a row without ADR/spec change. Optional flows (scroll restore, Settings Developer info, overflow delete) live in `deferred-work.md` until promoted to this table.

### Rule 3 — Test delta per epic (manual sign-off)

Minimum new tests by epic type:

| Epic type | Min pytest | Min e2e |
|-----------|------------|---------|
| Frontend-only (e.g. P2 search, returnUrl) | 0 | **+1** per new user-visible flow |
| Backend + frontend (e.g. P3 tags) | **+3** | **+1** |
| Refactor, no UX change | 0 | 0 (all existing e2e must stay green) |

Record in every spec:

```markdown
## Coverage baseline (epic start)
- Backend coverage: ___%  (`python -m pytest --cov=app -q`)
- pytest count: ___
- e2e count: ___
- Critical paths: 7/7

## Test delta (plan)
| Type | Min new |
|------|---------|
| pytest | ___ |
| e2e | ___ |

## Test delta (actual — epic sign-off)
| Type | Before | After | Delta | Plan met? |
|------|--------|-------|-------|-----------|
| pytest | | | | [ ] |
| e2e | | | | [ ] |
```

### Rule 4 — Coverage delta (manual sign-off)

Compare backend coverage at epic **start** vs **end**:

```
delta = coverage_after − coverage_before
```

| delta | Action |
|-------|--------|
| 0% to −2% | OK — record in spec |
| below −2% | Add pytest **or** document in `deferred-work.md` with reason and follow-up epic |
| below −85% absolute | CI already blocks (Rule 1) |

Example: baseline 92% → after 90% (Δ −2%) = OK. baseline 92% → after 89% (Δ −3%) = needs tests or defer.

---

## Coverage sign-off (add to epic close)

```
- [ ] Rule 1: CI backend job green (≥85%)
- [ ] Rule 2: CI e2e job green (7/7 critical paths)
- [ ] Rule 3: Test delta (actual) ≥ plan
- [ ] Rule 4: coverage delta ≥ −2% or deferred in deferred-work.md
```

Record in spec: `Coverage after: ___% (Δ ___%)`
