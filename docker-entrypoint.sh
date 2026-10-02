#!/bin/sh
set -e

# Las migraciones las aplica el servicio `init` de docker-compose, que web espera
# antes de arrancar (y con eso web no necesita esperar a la base). Se puede
# desactivar con RUN_MIGRATIONS=false; el valor por defecto sigue siendo true
# para que el contenedor funcione aunque se levante solo.
if [ "$RUN_MIGRATIONS" != "false" ]; then
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
else
  echo "[entrypoint] RUN_MIGRATIONS=false: se saltan las migraciones."
fi

# El seed es de arranque de desarrollo, no un reseteador: por defecto está
# apagado para que un despliegue no escriba datos de prueba. Prende
# RUN_SEED=true solo en el entorno de desarrollo.
if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] Ejecutando seed de datos (RUN_SEED=true)..."
  ./node_modules/.bin/tsx prisma/seed.ts
fi

echo "[entrypoint] Iniciando servidor..."
exec node server.js