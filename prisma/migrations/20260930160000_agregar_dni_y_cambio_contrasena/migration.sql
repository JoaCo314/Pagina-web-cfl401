-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "dni" TEXT;
ALTER TABLE "usuarios" ADD COLUMN "debeCambiarContrasena" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: a las cuentas que ya existían se les asigna un DNI ficticio de
-- prueba (80xxxxxx, derivado del id para que no se repita). Son datos
-- inventados para poder operar: hay que reemplazarlos por el DNI real de cada
-- persona, sobre todo antes de blanquearle la contraseña.
UPDATE "usuarios" SET "dni" = '80' || LPAD("id"::text, 6, '0') WHERE "dni" IS NULL;

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "dni" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_dni_key" ON "usuarios"("dni");