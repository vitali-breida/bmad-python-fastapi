# Accessibility (ADR-011 Phase 1)

## Scope

Automated axe scans cover:

- `/login` (unauthenticated)
- `/dashboard` (authenticated)
- `/notes` (authenticated)

Critical violations fail CI. Serious violations are fixed or deferred in `_bmad-output/implementation-artifacts/deferred-work.md`.

## Run axe tests

From `frontend/` with API on port 8000 (Playwright starts API + Vite via `webServer` config):

```bash
npm run test:a11y
```

Full e2e suite (includes `a11y.spec.ts`):

```bash
npm run test:e2e
```

## Keyboard spot-checks (manual)

- Tab from page load on a protected route: skip link appears on focus; Enter moves focus to `#main-content`.
- Login → dashboard → notes → detail: tab order is logical.
- Delete confirm dialog (`ConfirmDialog`): Cancel/Delete reachable by Tab; focus trap not yet implemented (see deferred-work).
- Notes list row ⋯ menu: open with Enter/Space; Escape closes.

## Design tokens

Semantic colors and focus rings live in `src/index.css` (`@theme`). Primary accent `#0d9488` on white button text meets WCAG 2.1 AA contrast.

## Limitations

- axe does not catch all accessibility issues; manual keyboard review is still required.
- Detail and Settings pages are not in the automated axe scope for v1.
- `ConfirmDialog` has no focus trap, initial focus move, or Escape-to-dismiss (deferred).
