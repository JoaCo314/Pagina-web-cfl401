-- Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).

-- CreateTable
CREATE TABLE "categorias_cursos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_cursos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_cursos_nombre_key" ON "categorias_cursos"("nombre");

-- AlterTable
ALTER TABLE "cursos" ADD COLUMN "categoriaId" INTEGER;

-- Backfill: cada categoría de texto que ya existía pasa a ser una fila del
-- catálogo y los cursos quedan apuntando a ella antes de borrar la columna.
INSERT INTO "categorias_cursos" ("nombre", "updatedAt")
SELECT DISTINCT btrim("categoria"), CURRENT_TIMESTAMP
FROM "cursos"
WHERE "categoria" IS NOT NULL AND btrim("categoria") <> '';

UPDATE "cursos" c
SET "categoriaId" = cc."id"
FROM "categorias_cursos" cc
WHERE c."categoria" IS NOT NULL AND btrim(c."categoria") = cc."nombre";

-- AlterTable
ALTER TABLE "cursos" DROP COLUMN "categoria";

-- CreateIndex
CREATE INDEX "cursos_categoriaId_idx" ON "cursos"("categoriaId");

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_cursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
