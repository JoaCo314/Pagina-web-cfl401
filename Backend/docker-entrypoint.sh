#!/bin/sh
set -e

echo "[entrypoint] Aplicando migraciones de la base de datos..."

attempts=0
while ! ./node_modules/.bin/prisma migrate deploy; do
  attempts=$((attempts + 1))
  retries=${MIGRATE_RETRIES:-30}
  if [ "$attempts" -ge "$retries" ]; then
    echo "[entrypoint] ERROR: no se pudieron aplicar las migraciones tras $attempts intentos." >&2
    exit 1
  fi
  echo "[entrypoint] Base de datos no disponible todavia, reintentando en 2s (intento $attempts/$retries)..."
  sleep 2
done

if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] Ejecutando seed de datos (RUN_SEED=true)..."
  ./node_modules/.bin/tsx prisma/seed.ts
fi

echo "[entrypoint] Migraciones aplicadas. Iniciando servidor..."
exec node server.js