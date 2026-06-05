# Deferred work

## CI/CD and preview (ADR-004)

**ADR:** `../planning-artifacts/adr/adr-004-ci-cd-and-preview-deployment.md`  
**Phased plan:** `plan-ci-cd-phases.md`  
**Preview (v1):** https://bmad-python-fastapi.onrender.com/

**v1 complete (2026-05-22):** Phase 1 CI + Phase 2 Render manual deploy. ADR-004 closed for now unless a backlog item is picked up.

**Deferred (Phase 3 and backlog):**

- **Neon Postgres** on Render — set `DATABASE_URL`; notes survive redeploy (`psycopg` already in repo).
- Playwright login → notes CRUD on live API (CI or against preview).
- Post-deploy smoke in workflow (`curl /health`, login after Render deploy).
- Auto-deploy on `main` merge.
- Postgres for local dev (optional; local stays SQLite).
- Rate limiting on public preview; custom domain on Render.

## ADR-003 edge-case follow-up (consolidated)

Full hunter pass (ADR + spec): **`adr-003-follow-up-edge-cases.md`**.  
**Ready to implement (items 1–4):** **`req-adr-003-follow-up-items-1-4.md`**.

## Deferred from: code review of spec-adr-008-frontend-routing-v1.md (2026-06-05)

- Scroll restoration AC has no e2e coverage — spec defers full Playwright matrix; manual check only.
- ADR planning doc (`adr-008-frontend-routing-v1.md`) implementation-status table still shows Pending — sync when v1 ships.
- AC7 Playwright pass not verified in review session — API on :8000 was not running; re-run `npx playwright test` with uvicorn.

## Deferred from: code review of spec-adr-003-jwt-authentication.md (2026-05-21)

- E2E does not exercise login → notes CRUD — ADR marks full Playwright auth smoke as optional follow-up.
- Duplicate `PasswordHash` setup in migration and `app/auth/security.py` — shared helper would reduce drift risk; behavior is correct today.
- ~~ADR security checklist~~ — ticked in planning ADR on implementation acceptance (2026-05-21); rate limiting remains optional follow-up.

## Deferred from: code review of spec-adr-009-dashboard-notes-ux-v2.md (2026-06-05)

- Background refetch may overwrite in-progress detail form edits — pre-existing optimistic-update pattern; unsaved-changes warning out of scope v1.
- Second navigation with new toast state lost when same `noteId` — rare re-navigation edge case.
- bfcache restoration may replay creation toast — low-frequency browser back/forward scenario.
