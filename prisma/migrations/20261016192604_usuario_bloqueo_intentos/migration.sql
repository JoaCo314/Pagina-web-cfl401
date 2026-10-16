-- Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "bloqueada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bloqueadaEn" TIMESTAMP(3);
