#!/usr/bin/env sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export DATABASE_URL="${DATABASE_URL:-sqlite:///${ROOT}/e2e-notes.db}"
rm -f "${ROOT}/e2e-notes.db" 2>/dev/null || true
PYTHON="${PYTHON:-python}"
"$PYTHON" -m alembic upgrade head
exec "$PYTHON" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
