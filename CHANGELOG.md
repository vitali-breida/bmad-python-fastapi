# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/vitali-breida/bmad-python-fastapi/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/vitali-breida/bmad-python-fastapi/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/vitali-breida/bmad-python-fastapi/releases/tag/v0.4.0
