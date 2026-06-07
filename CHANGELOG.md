# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.4] - 2026-06-07

### Added

- Test coverage and quality policy (ADR-010): CI enforces ≥85% line coverage on `app/` via `pytest-cov`; canonical critical-path e2e checklist and epic sign-off templates in `quality-gates.md`.

### Changed

- Sync ADR-008/009 planning docs to implemented status; Epic 9 retrospective artifacts.

## [0.4.3] - 2026-06-05

### Changed

- Dashboard & Notes UX v2 (ADR-009): hub/browse/work page roles — recent notes on dashboard, list-only notes page with expandable create panel, toast feedback, overflow delete menu, API version moved to Settings Developer info.

## [0.4.2] - 2026-06-05

### Added

- Multi-page routing with React Router (ADR-008): dashboard, notes list and detail, settings, protected routes, and breadcrumbs.

### Fixed

- Sync `frontend/package-lock.json` for Linux CI `npm ci` (missing `@emnapi` entries).

## [0.4.1] - 2026-06-05

### Added

- TanStack Query v2 patterns (ADR-007): auth session via `useMeQuery` / `useLoginMutation`, optimistic note CRUD, detail prefetch, `updated_at` in the list.
- E2E coverage for session resolution and notes CRUD.
- Product versioning (ADR-006): root `VERSION`, UI footer `v{semver}`, `version` on `GET /health`.

## [0.4.0] - 2026-05-21

### Changed

- **Breaking:** all `/notes` endpoints require `Authorization: Bearer` (JWT authentication, ADR-003).
- API product version `0.4.0` when auth ships.

### Added

- Stateless JWT login (`POST /auth/login`), `GET /auth/me`, bootstrap `admin` user via migration `003_add_users_table`.
- React web UI with TanStack Query for notes CRUD (ADR-005).
- CI/CD preview deploy with coupled Docker image (ADR-004).

[Unreleased]: https://github.com/vitali-breida/bmad-python-fastapi/compare/v0.4.4...HEAD
[0.4.4]: https://github.com/vitali-breida/bmad-python-fastapi/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/vitali-breida/bmad-python-fastapi/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/vitali-breida/bmad-python-fastapi/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/vitali-breida/bmad-python-fastapi/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/vitali-breida/bmad-python-fastapi/releases/tag/v0.4.0
