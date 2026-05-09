#!/bin/sh
set -e

echo "[entrypoint] aguardando Postgres ficar pronto..."
TIMEOUT="${DB_WAIT_TIMEOUT:-30}"
COUNT=0
until pg_isready -d "$DATABASE_URL" -q; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$TIMEOUT" ]; then
    echo "[entrypoint] Postgres não respondeu em ${TIMEOUT}s — abortando"
    exit 1
  fi
  sleep 1
done
echo "[entrypoint] Postgres pronto após ${COUNT}s"

cd /app/apps/api

echo "[entrypoint] status das migrations:"
npx --no-install prisma migrate status || true

echo "[entrypoint] aplicando migrations pendentes..."
npx --no-install prisma migrate deploy

cd /app
echo "[entrypoint] iniciando Nest..."
exec node apps/api/dist/main.js
