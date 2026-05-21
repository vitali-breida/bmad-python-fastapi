---
stepsCompleted: [1]
inputDocuments: ['_bmad-output/project-context.md']
session_topic: 'Authentication only for Notes API + React UI — block anonymous API access, login on UI (authorization/RBAC deferred)'
session_goals: 'Explore authn approaches and trade-offs; converge on recommended authn design and implementation increments; defer roles/permissions to a follow-up session'
session_scope_narrowed: '2026-05-21 — user narrowed from authn+authz to authn-only'
selected_approach: ''
techniques_used: []
ideas_generated: []
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Vitali
**Date:** 2026-05-21

## Session Overview

**Topic:** **Authentication only** — no anonymous API; login on React UI. Authorization (roles, permissions, admin matrix) **out of scope** for this session; planned as follow-up.

**Goals:**
- Protect API endpoints from unauthenticated callers (401 without valid credentials/token).
- UI login/logout and attaching credentials to API calls.
- User identity in API context (`get_current_user`, `user_id` on notes where needed for future authz).
- Stay aligned with brownfield patterns: thin routers, `store`, Alembic, Vite dev proxy.
- Output: authn design recommendation + concrete implementation checklist (authz later).

**Explicitly deferred:**
- Roles, permissions, `require_permission`, admin vs editor matrix.

### Context Guidance

- Current stack: FastAPI sync, SQLite, SQLAlchemy, React 19 + TS, Playwright smoke; no auth today.
- `project-context.md` emphasizes dependency injection, repository layer, migration discipline.
- Prior paused brainstorm (`brainstorming-session-2026-05-21-1017.md`) covered production-readiness ladder — separate thread.

### Session Setup

- Initial scope (2026-05-21): authn + authz with RBAC; **narrowed same day** to authn-only.
- User decision: implement authentication first; authorization in a separate effort.
- Open design axes (authn): token transport (Bearer JWT vs session cookie), `users` schema + password hashing, login/register endpoints, `owner_id` on notes (prep for authz), frontend token storage, test strategy with `TestClient`, bootstrap first user.
- Deferred axes: roles, permissions tables, admin matrix, UI gating by permission.

## Deliverable for team review

- **ADR (Proposed):** `_bmad-output/planning-artifacts/adr/adr-003-stateless-jwt-authentication.md`
- Validate with architect/team in a separate chat; status remains **Proposed** until sign-off table is filled.
