#!/bin/sh
set -e

# Respaldo de la base en formato custom (comprimido) dentro de BACKUP_DIR.
# Pensado para correr como servicio `backup` de docker-compose:
#
#   docker compose --profile backup run --rm backup
#
# Los datos de conexión llegan por variables de entorno (PGHOST, PGUSER,
# PGPASSWORD, PGDATABASE) que define el servicio en docker-compose.yml.
DIR="${BACKUP_DIR:-/backups}"
mkdir -p "$DIR"

ARCHIVO="$DIR/cfl401-$(date +%Y%m%d-%H%M%S).dump"
echo "[backup] Generando $ARCHIVO ..."
pg_dump -F c -f "$ARCHIVO"

echo "[backup] Respaldo generado. Contenido de $DIR:"
ls -lh "$DIR"

# Para restaurar (sobre una base vacía):
#   pg_restore -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists "$ARCHIVO"
