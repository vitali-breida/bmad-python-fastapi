# Deferred work

## ADR-003 edge-case follow-up (consolidated)

Full hunter pass (ADR + spec): **`adr-003-follow-up-edge-cases.md`**.  
**Ready to implement (items 1–4):** **`req-adr-003-follow-up-items-1-4.md`**.

## Deferred from: code review of spec-adr-003-jwt-authentication.md (2026-05-21)

- E2E does not exercise login → notes CRUD — ADR marks full Playwright auth smoke as optional follow-up.
- Duplicate `PasswordHash` setup in migration and `app/auth/security.py` — shared helper would reduce drift risk; behavior is correct today.
- ~~ADR security checklist~~ — ticked in planning ADR on implementation acceptance (2026-05-21); rate limiting remains optional follow-up.
