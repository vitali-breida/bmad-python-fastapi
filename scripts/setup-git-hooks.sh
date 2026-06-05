#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit scripts/sync-frontend-lockfile-docker.sh
echo "Git hooks path set to .githooks"
echo "pre-commit will run npm ci when frontend/package*.json is staged."
