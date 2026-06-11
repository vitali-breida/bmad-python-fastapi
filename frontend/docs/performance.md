# Frontend performance

## Bundle budget (ADR-013)

After each production build, CI verifies that the total gzip size of JavaScript assets in `dist/assets/*.js` stays within the limit defined in `frontend/package.json`:

```json
"budgets": {
  "totalJsGzipKb": 98
}
```

### Run locally

```bash
cd frontend
npm run build
npm run check:budget
```

`check:budget` assumes `dist/` already exists (run `build` first). On failure, the script prints the three largest JS chunks and exits non-zero.

### Raising the limit

If a change legitimately increases bundle size (for example a new dependency), update `budgets.totalJsGzipKb` in `package.json` and document the reason in the pull request. Baseline at ADR-013 implementation: **~92.6 KB** gzip JS with **~5%** headroom (**98 KB** cap).

### Out of scope

Lighthouse is not a blocking CI gate. Use manual Lighthouse runs when exploring runtime performance; the bundle check is the stable signal enforced in CI.
