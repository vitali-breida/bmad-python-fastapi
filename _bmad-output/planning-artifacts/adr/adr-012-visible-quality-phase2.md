# ADR-012: Visible Quality — Phase 2 (README + architecture diagram + security narrative)

**Status:** Accepted  
**Date:** 2026-06-10  
**Scope:** Repository documentation — portfolio-facing README, architecture diagram, and explicit security trade-off narrative. **No route map, API contract, auth behavior, or runtime code changes** unless a doc-accuracy fix is unavoidable (e.g. stale version strings).  
**Related:** ADR-011 Phase 1 (visual + a11y), ADR-003 (JWT auth), ADR-004 (CI/CD + same-origin preview), ADR-006 (versioning), ADR-010 (coverage policy), `../brainstorming/brainstorming-session-2026-06-10-1200.md`.  
**Continues:** ADR-011 Visible Quality strategy — Phase 2 of 3.

## Context

Brainstorming (2026-06-10) defined **Visible Quality**: each increment ships something **showable** (craft) and **verifiable** (evidence). Phase 1 (ADR-011) delivered visual identity + axe accessibility baseline (v0.4.9).

**Phase 2 (this ADR):** README rewrite + simple architecture diagram + security narrative.  
**Phase 3 (deferred):** distinctive UI spark + performance budget.

**Current documentation gaps:**

| Gap | Impact |
|-----|--------|
| README reads as tutorial setup guide | Interviewer cannot grasp project story in ~2 minutes |
| No architecture diagram | Maturity signal missing; infra looks accidental |
| Security choices scattered across ADR-003 | JWT/CORS/cookie/header posture not reviewer-friendly |
| Stale version references in README (e.g. v0.4.5) | Undermines trust in docs accuracy |
| Phase 1 a11y artifact not linked from README | Evidence dimension invisible to GitHub visitors |

**Foundation is sufficient:** auth, CI, ADR chain, E2E, Neon preview, Phase 1 UI — no new backend features required for Phase 2.

**Audience:** learning playground + portfolio reviewers (same as brainstorming). Not end-user product docs.

## Decision

| Area | Choice |
|------|--------|
| **Relationship to ADR-011** | **Continues** Visible Quality A+B — Phase 2 pairs **craft** (README voice + diagram) with **evidence** (documented security trade-offs). |
| **Strategy** | **Docs-only epic** — narrative and diagrams; behavior unchanged. |
| **README voice** | **Portfolio story first** — what the project is, why it exists, what maturity signals exist; setup/run instructions follow, condensed where duplicated. Lead with preview link, quality evidence links, and architecture diagram reference. |
| **README structure (normative sections)** | 1) Title + CI badge + one-liner + **live preview** link. 2) **What this is** (learning + portfolio; coherent story not experiments). 3) **Architecture at a glance** — embed or link diagram. 4) **Quality & security** — bullets linking `docs/security.md`, `frontend/docs/accessibility.md`, ADR index. 5) **Quick start** (prerequisites + 3 commands max before “details below”). 6) Existing deep sections (Docker, migrations, CI, Render) retained but reorganized — no content deletion of operator-critical steps. |
| **Architecture diagram** | New **`docs/architecture.md`** — single **Mermaid** diagram (high level, non-intimidating): Browser → dev Vite proxy **or** prod nginx → FastAPI → SQLite/Neon; JWT Bearer on API calls; CI jobs summary. Optional second small diagram for auth login sequence (reuse ADR-003 pattern, simplified). README links to this file; diagram also summarized inline (one compact Mermaid block) for GitHub render without click-through. |
| **Security narrative** | New **`docs/security.md`** — explicit trade-offs for reviewers: stateless JWT (ADR-003), `sessionStorage` token storage + XSS awareness, **same-origin** deployment (no CORS in v1 — Vite proxy dev, nginx prod), **no auth cookies** (why), production env guards (`SECRET_KEY`, `DATABASE_URL`, `ENVIRONMENT`), secrets handling. **Headers posture:** document which security headers are **not** set in v1 (CSP, HSTS, `X-Frame-Options`, etc.) and why deferral is acceptable on free-tier learning preview; optional nginx hardening listed as **future** backlog, not Phase 2 implementation. |
| **ADR cross-links** | `docs/security.md` and README **Quality & security** section link to ADR-003, ADR-004, ADR-010, ADR-011. ADR-003 security checklist remains source of truth for implementation facts; Phase 2 **summarizes for humans**, does not duplicate full ADR text. |
| **Version accuracy** | README product-version table and examples updated to current `VERSION` at implementation time. |
| **New npm / Python deps** | **None** |
| **Backend / frontend code** | **No changes** (docs + README only). Exception: fix objectively wrong strings in README only. |
| **Product version bump** | **PATCH** (`0.4.9` → `0.4.10`) — user-visible documentation refresh on primary GitHub entry point (ADR-006). |
| **Tests** | **0** new pytest / e2e (docs-only epic per ADR-010 Rule 3 “refactor, no UX change”). All existing CI jobs must stay green. |
| **Docs** | `README.md`, `docs/architecture.md`, `docs/security.md`; `CHANGELOG.md`; `deferred-work.md` (move Phase 2 from deferred → in progress/done); optional one-line `project-context.md` pointer to `docs/security.md`. |

### Out of scope (Phase 2)

- Implementing CSP, HSTS, or other security headers in nginx/FastAPI
- CORS middleware (same-origin architecture remains; document only)
- Refresh tokens, RBAC, rate limiting, `owner_id` on notes
- README localization (English only)
- OpenAPI highlights embedded in README (later backlog)
- Observability / contribution guide (later Visible Quality slices)
- Phase 3 spark + Lighthouse CI
- Changing auth token storage (sessionStorage → httpOnly cookie)

### Rejected (for this ADR)

| Proposal | Reason |
|----------|--------|
| Bundle Phase 3 perf/spark here | Brainstorming order — one quality dimension per phase |
| Replace ADRs with README-only security | ADRs stay canonical; README summarizes |
| Auto-generate diagram from code | Manual Mermaid keeps diagram approachable for interviewers |
| Major README deletion of setup/migration docs | Operators still need brownfield migration notes; reorganize, don’t gut |
| Security headers implementation in Phase 2 | Evidence slice is **narrative**; header hardening is separate infra epic |

## Architecture

### Documentation layout

```
README.md                      # REFACTOR — story-first structure
docs/
  architecture.md              # NEW — Mermaid system + auth overview
  security.md                    # NEW — trade-offs, same-origin, headers posture
  releases/compatibility.md      # UNCHANGED (link from README if not already)
frontend/docs/accessibility.md   # UNCHANGED — linked from README
_bmad-output/planning-artifacts/adr/
  adr-003-stateless-jwt-authentication.md   # linked, not edited
  adr-011-visible-quality-phase1.md         # linked
  adr-012-visible-quality-phase2.md         # this document
```

### Diagram content (normative)

**System context (required in `docs/architecture.md`):**

```
[Browser SPA] --same origin--> [nginx OR Vite dev proxy] --> [FastAPI :8000] --> [SQLite | Neon Postgres]
                                      |
                               static React dist
```

**CI context (required, compact):** GitHub Actions — backend pytest+cov, frontend lint+build, e2e Playwright.

**Auth (required, simplified):** login form → JWT → `sessionStorage` → `Authorization: Bearer` on `/notes` and `/auth/me`.

## Implementation phases

| Phase | Goal | Key files |
|-------|------|-----------|
| **1** | Security narrative artifact | `docs/security.md` |
| **2** | Architecture diagram artifact | `docs/architecture.md` |
| **3** | README rewrite + cross-links | `README.md` |
| **4** | Release hygiene + deferred-work sync | `CHANGELOG.md`, `VERSION`, `deferred-work.md`, `project-context.md` (optional) |

Detailed checklist: `../../implementation-artifacts/spec-adr-012-visible-quality-phase2.md`.

## Testing strategy

| Test | Expectation |
|------|-------------|
| Critical paths 7/7 | Unchanged — all green |
| `npm run lint` / `npm run build` | Unchanged — green (no frontend code delta) |
| `python -m pytest --cov=app --cov-fail-under=85` | Unchanged — green |
| Manual doc review | Interviewer can read README + diagram in ≤2 min; security trade-offs explicit |
| Link check | All relative links in README and new docs resolve |

## Gate «достаточно» (Phase 2 complete)

- [ ] Author approves README voice — “this sounds like my project, not a template” (subjective craft gate — awaiting Vitali sign-off)
- [x] `docs/architecture.md` diagram renders on GitHub
- [x] `docs/security.md` covers JWT, storage, same-origin/CORS, cookies, headers deferral
- [x] README links preview, architecture, security, accessibility evidence
- [ ] All Quality Gates in spec marked complete (pending CI verification + author craft gate)

## Consequences

### Positive

- **Authorship signal** — README + diagram show deliberate architecture, not prompt output
- **Second verified quality dimension** — security literacy documented for portfolio review
- **Onboarding path** — quick start for learners; deep sections preserved for operators
- **No runtime risk** — docs-only increment

### Negative / trade-offs

- Docs can drift from code — version table must be updated at each release
- Security narrative documents gaps (no CSP) — reviewers may ask “why not fix?” — deferrals must be explicit
- README length may grow — story-first structure must stay scannable (TOC or clear headings)
- Mermaid rendering differs on some viewers — keep diagram simple

## Compliance

- [x] ADR-012 accepted before implementation starts (this document)
- [x] `npm run lint`, `npm run build`, `npm run test:e2e`, `python -m pytest --cov=app --cov-fail-under=85` pass
- [x] VERSION + CHANGELOG PATCH bump on release
- [x] `deferred-work.md` Phase 2 status updated when shipped
- [x] Phase 3 tracked in `deferred-work.md`

## Implementation status

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Security narrative | Done | `docs/security.md` |
| 2 — Architecture diagram | Done | `docs/architecture.md` |
| 3 — README rewrite | Done | story-first structure + TOC |
| 4 — Release + deferred sync | Done | v0.4.10 |

## References

- Brainstorming: `_bmad-output/brainstorming/brainstorming-session-2026-06-10-1200.md`
- ADR-011 Phase 1: `_bmad-output/planning-artifacts/adr/adr-011-visible-quality-phase1.md`
- ADR-003 JWT: `_bmad-output/planning-artifacts/adr/adr-003-stateless-jwt-authentication.md`
- ADR-004 Deploy: `_bmad-output/planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md`
- Spec: `_bmad-output/implementation-artifacts/spec-adr-012-visible-quality-phase2.md`

## Review sign-off

| Role | Name | Date | Approved / Changes requested |
|------|------|------|------------------------------|
| Architect | Vitali | 2026-06-10 | Approved |
