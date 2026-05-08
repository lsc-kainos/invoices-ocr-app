#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="invoices-postgres"
TIMEOUT_SEC=60

echo "→ subindo Postgres..."
docker compose up -d postgres

echo "→ aguardando healthcheck (timeout ${TIMEOUT_SEC}s)..."
ELAPSED=0
while true; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "✓ Postgres healthy"
    break
  fi
  if [ "$ELAPSED" -ge "$TIMEOUT_SEC" ]; then
    echo "✗ Postgres não ficou healthy em ${TIMEOUT_SEC}s (status atual: $STATUS)"
    exit 1
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

echo "→ rodando prisma migrate deploy..."
npm --workspace=@invoices-ocr/api exec -- prisma migrate deploy

if node -e "process.exit(require('./apps/api/package.json').prisma?.seed ? 0 : 1)" 2>/dev/null; then
  echo "→ rodando prisma db seed..."
  npm --workspace=@invoices-ocr/api exec -- prisma db seed
else
  echo "→ sem seed configurado, pulando"
fi

echo "✓ db:setup completo"
