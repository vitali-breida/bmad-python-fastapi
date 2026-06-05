---
name: release-preflight
description: >-
  Before commit or push: bump product VERSION (ADR-006), sync frontend/package.json
  and CHANGELOG, verify package-lock.json with npm ci, regenerate lockfile on Linux
  when frontend deps change. Use when user commits, pushes, merges, releases, or
  ships a feature; or says "preflight", "bump version", "sync lockfile".
---

# Release preflight

Run **before every commit or push** that ships user-visible work (especially `frontend/` changes).

## 1. Version bump (ADR-006)

Canonical source: root **`VERSION`** (plain semver, no `v` prefix).

| Change type | Bump | Example |
|-------------|------|---------|
| New feature / user-visible UI (feat) | PATCH `z` | `0.4.1` → `0.4.2` |
| Bugfix only (fix) | PATCH `z` | `0.4.1` → `0.4.2` |
| Breaking user/API contract (pre-1.0) | MINOR `y` | `0.4.1` → `0.5.0` |

**Always update together:**

1. `VERSION`
2. `frontend/package.json` → `"version"` (mirror only)
3. `CHANGELOG.md` → move items from `[Unreleased]` into `[x.y.z] - YYYY-MM-DD`

Do **not** bump for docs-only or pure `_bmad-output/` commits unless the user asks.

## 2. package-lock.json (frontend)

Lockfile must pass **`npm ci`** on Linux Node 24 (CI). Windows-only lockfiles break CI (`@emnapi/core` / `@emnapi/runtime` missing).

**When `frontend/package.json` or dependencies changed:**

1. Regenerate on Linux (WSL2 Docker — preferred):

   ```bash
   cd /mnt/c/Projects/bmad-python-fastapi && docker run --rm -v "$(pwd)":/repo -w /repo/frontend node:24-bookworm sh -c "rm -rf node_modules && npm install && rm -rf node_modules && npm ci"
   ```

   Or run: `scripts/sync-frontend-lockfile-docker.sh` from repo root in WSL.

2. Verify locally:

   ```bash
   cd frontend && rm -rf node_modules && npm ci && npm run lint && npm run build
   ```

3. Commit `package-lock.json` in the **same PR/commit** as `package.json` dependency changes.

**When only app code changed (no `package.json` dep edits):** `npm ci` in `frontend/` is enough; skip Docker unless CI already failed on lockfile.

## 3. Pre-commit hook

Repo uses `.githooks/pre-commit` (see `scripts/setup-git-hooks.ps1`). It auto-runs `npm ci` when `frontend/package*.json` is staged and checks `VERSION` ↔ `package.json` sync.

## 4. Agent checklist (before commit/push)

- [ ] `VERSION` === `frontend/package.json` version
- [ ] `CHANGELOG.md` updated if version bumped
- [ ] If `frontend/package.json` deps changed → lockfile regenerated (Docker/WSL) + `npm ci` passes
- [ ] `cd frontend && npm run lint && npm run build` pass
- [ ] Stage `VERSION`, `package-lock.json`, `CHANGELOG.md` with the feature commit (don't leave version bump for later)

## 5. Commit message

Use existing `git-commit` skill. Version-only follow-up:

```
chore(release): bump product version to x.y.z
```

Lockfile-only fix:

```
fix(frontend): sync package-lock.json for Linux CI npm ci
```
