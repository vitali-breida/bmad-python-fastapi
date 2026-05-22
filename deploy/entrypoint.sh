#!/bin/sh
set -e
cd /app

alembic upgrade head
python -c "from app.auth.config import validate_production_config; validate_production_config()"

export PORT="${PORT:-10000}"
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1 &
UVICORN_PID=$!
trap 'kill -TERM "$UVICORN_PID" 2>/dev/null; exit 143' TERM INT

nginx -g 'daemon off;'
