#!/usr/bin/env bash
# Regenerate frontend/package-lock.json on Linux Node 24 (matches GitHub Actions CI).
# Run from repo root in WSL2 where Docker is available.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker run --rm -v "$ROOT":/repo -w /repo/frontend node:24-bookworm \
  sh -c "rm -rf node_modules && npm install && rm -rf node_modules && npm ci"

echo "OK: package-lock.json updated. Verify with: cd frontend && npm run build"
