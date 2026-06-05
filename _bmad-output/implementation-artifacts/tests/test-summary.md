# Test Automation Summary

**Date:** 2026-06-05  
**Scope:** ADR-007 — TanStack Query v2 session resolution and notes CRUD  
**Framework:** Playwright (`frontend/e2e/`)

## Generated Tests

### E2E Tests

- [x] `frontend/e2e/helpers/auth.ts` — shared `signIn()` helper; waits for `notes-app` after `GET /auth/me`
- [x] `frontend/e2e/session.spec.ts` — ADR-007 session resolution (6 scenarios)
- [x] `frontend/e2e/notes-crud.spec.ts` — notes create / read / update / delete (4 scenarios)
- [x] `frontend/e2e/notes-smoke.spec.ts` — updated to use shared `signIn()` helper

### API Tests (existing — no changes)

Backend pytest already covers auth and notes CRUD (`tests/test_auth.py`, `tests/test_notes.py`).

## Coverage

| Area | Scenarios covered |
|------|-------------------|
| **Session — login** | Valid login loads notes app; invalid credentials show error |
| **Session — refresh** | Valid token → resolving → `notes-app`; invalid token → silent login |
| **Session — failure / retry** | `GET /auth/me` 503 → `session-error` + Retry → recovery |
| **Session — logout** | Clears session; reload shows login |
| **Notes CRUD** | Full create → select → update (`updated_at`) → delete flow |
| **Notes UI** | New note clears editor; title validation; delete dialog cancel |
| **Smoke** | Build version on login and post-sign-in |

## Config change

`frontend/playwright.config.ts` now passes `SECRET_KEY` and `INITIAL_ADMIN_PASSWORD` defaults to the e2e API `webServer`, so isolated runs work without a pre-exported shell env (CI still overrides via job `env`).

## Verification

```
cd frontend && npm run test:e2e
12 passed (19.5s)
```

**Local note:** When reusing an already-running dev API (`reuseExistingServer: true`), set `INITIAL_ADMIN_PASSWORD` to match your `.env` bootstrap password. CI uses `e2e-ci-admin-password` via GitHub Actions job `env`.

## Next Steps

- Run `npm run test:e2e` in CI on every PR (already in `.github/workflows/ci.yml`)
- Optional: add expired-JWT refresh test if a test-only token helper is introduced later
