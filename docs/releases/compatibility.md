# Release compatibility policy

This project ships as **one deployable unit**: a single Docker image contains the API (Uvicorn) and the production Vite static build (ADR-004). The product version is the semver in the root [`VERSION`](../../VERSION) file (ADR-006).

## Coupled deploy

- **Do not** upgrade only the API or only the frontend in production. There is no supported partial upgrade path.
- **One image = one release.** The UI footer (`v{semver}`) and `GET /health` `version` field both reflect the same product version baked at build time.
- Preview and production hosts serve API and UI from the same origin (nginx proxies `/notes`, `/auth`, `/health`, `/docs`).

## When a compatibility matrix may appear

A version matrix (which frontend build works with which API) is **deferred** until:

- Frontend and API deploy on independent release channels, or
- External API clients require explicit compatibility documentation.

Until then, use [`CHANGELOG.md`](../../CHANGELOG.md) for breaking changes and migration notes.

## Pre-1.0 semver (`0.y.z`)

Until `1.0.0`:

- **MINOR (`y`):** breaking API or user-visible contract change.
- **PATCH (`z`):** backward-compatible features or bugfixes with no contract change.

At `1.0.0` and above, standard semver MAJOR/MINOR/PATCH applies. The cutover will be documented in `CHANGELOG.md`.
