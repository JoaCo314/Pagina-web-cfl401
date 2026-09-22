/*
  Warnings:

  - You are about to drop the column `requisitos` on the `cursos` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacion` on the `cursos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cursos" DROP COLUMN "requisitos",
DROP COLUMN "ubicacion";
