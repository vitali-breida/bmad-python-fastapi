FROM node:24-bookworm-slim AS frontend-build
ARG APP_VERSION
ARG VITE_APP_VERSION=${APP_VERSION}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
WORKDIR /build
COPY VERSION ./VERSION
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim-bookworm
ARG APP_VERSION
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl nginx gettext-base \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY VERSION ./VERSION
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV APP_VERSION=${APP_VERSION}
COPY --from=frontend-build /build/dist /app/frontend/dist

ENV PORT=10000
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD /bin/sh -c 'curl -fsS "http://127.0.0.1:${PORT:-10000}/health" || exit 1'
ENTRYPOINT ["/entrypoint.sh"]
