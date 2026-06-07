# Deferred work

## Coverage policy (ADR-010)

**ADR:** `../planning-artifacts/adr/adr-010-test-coverage-and-quality-policy.md`  
**Spec:** `spec-adr-010-test-coverage-and-quality-policy.md`

**v1 complete (2026-06-07):** Rules 1–2 CI-enforced; Rules 3–4 manual epic sign-off via spec templates in `quality-gates.md`.

**Deferred:**

- **Automated Rule 4 in CI** — compare backend coverage at epic start vs end in workflow; manual spec sign-off sufficient for solo dev v1.

## CI/CD and preview (ADR-004)

**ADR:** `../planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md`  
**Phased plan:** `plan-ci-cd-phases.md`  
**Spec:** `spec-adr-004-phase3-neon-postgres.md`  
**Preview:** https://bmad-python-fastapi.onrender.com/ (Neon Postgres; v0.4.5)

**Complete (2026-06-07):** Phases 1–3 — CI, Render manual deploy, Neon persistence + production `DATABASE_URL` guard. Persistence smoke passed.

**Deferred (backlog):**

- **CI Postgres migration smoke (Phase 2b)** — `postgres:16` service job or documented one-off Neon `alembic upgrade head` in CI; migrations verified manually on Neon 2026-06-07.
- Playwright login → notes CRUD on live API (CI or against preview).
- Post-deploy smoke in workflow (`curl /health`, login after Render deploy).
- Auto-deploy on `main` merge.
- Postgres for local dev (optional; local stays SQLite).
- Rate limiting on public preview; custom domain on Render.

## Deferred from: code review of spec-adr-004-phase3-neon-postgres.md (2026-06-07)

- **Non-Postgres URL not positively validated** — spec I/O matrix only requires rejecting missing/SQLite; `mysql://` etc. not in scope for this epic.
- **`file:` database scheme not rejected** — local dev uses `sqlite://` only; not in spec I/O matrix.
- **`ENV=prod` alias not covered in test matrix** — minor gap; `_is_production()` predates this change.
- **Phase 1 AC #4 (dev import unchanged) not directly asserted** — suite passes; indirect coverage sufficient for v1.
- **Padded Postgres URL not stripped before normalize** — guard uses `.strip()`; `DATABASE_URL` assignment does not; unlikely via Render dashboard paste.

## ADR-003 edge-case follow-up (consolidated)

Full hunter pass (ADR + spec): **`adr-003-follow-up-edge-cases.md`**.  
**Ready to implement (items 1–4):** **`req-adr-003-follow-up-items-1-4.md`**.

## Deferred from: code review of spec-adr-008-frontend-routing-v1.md (2026-06-05)

**ADR-008 v1 complete (2026-06-07):** planning doc implementation-status synced; spec `status: done`.

- Scroll restoration AC has no e2e coverage — spec defers full Playwright matrix; manual check only.
- ~~ADR planning doc implementation-status table still shows Pending~~ — synced 2026-06-07.
- ~~AC7 Playwright pass not verified in review session~~ — verified on implementation acceptance 2026-06-07.

## Deferred from: code review of spec-adr-003-jwt-authentication.md (2026-05-21)

- E2E does not exercise login → notes CRUD — ADR marks full Playwright auth smoke as optional follow-up.
- Duplicate `PasswordHash` setup in migration and `app/auth/security.py` — shared helper would reduce drift risk; behavior is correct today.
- ~~ADR security checklist~~ — ticked in planning ADR on implementation acceptance (2026-05-21); rate limiting remains optional follow-up.

## Deferred from: code review of spec-adr-009-dashboard-notes-ux-v2.md (2026-06-05)

**ADR-009 complete (2026-06-07):** planning doc status + implementation-status synced; spec `status: done`.

- Background refetch may overwrite in-progress detail form edits — pre-existing optimistic-update pattern; unsaved-changes warning out of scope v1.
- Second navigation with new toast state lost when same `noteId` — rare re-navigation edge case.
- bfcache restoration may replay creation toast — low-frequency browser back/forward scenario.

## Deferred from: code review of spec-adr-010-test-coverage-and-quality-policy.md (2026-06-07)

- ADR-008/009 status sync bundled in same working tree — out-of-scope doc housekeeping, not ADR-010 regression.
- Local Playwright failures in `test-results/` (wrong `INITIAL_ADMIN_PASSWORD`) — CI env uses `e2e-ci-admin-password`; re-run with matching env to verify Rule 2 locally.
