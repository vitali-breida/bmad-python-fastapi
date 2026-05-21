# Deferred work

## Deferred from: code review of spec-adr-003-jwt-authentication.md (2026-05-21)

- E2E does not exercise login → notes CRUD — ADR marks full Playwright auth smoke as optional follow-up.
- Duplicate `PasswordHash` setup in migration and `app/auth/security.py` — shared helper would reduce drift risk; behavior is correct today.
- ~~ADR security checklist~~ — ticked in planning ADR on implementation acceptance (2026-05-21); rate limiting remains optional follow-up.
