-- AlterTable
ALTER TABLE "contenidos_guia" ADD COLUMN     "contenidoHtml" TEXT;

-- AlterTable
ALTER TABLE "cursos" ADD COLUMN     "programaContenidosHtml" TEXT;

-- AlterTable
ALTER TABLE "preguntas_frecuentes" ADD COLUMN     "respuestaHtml" TEXT;

-- AlterTable
ALTER TABLE "sobre_el_centro" ADD COLUMN     "historiaTextoHtml" TEXT,
ADD COLUMN     "introHtml" TEXT,
ADD COLUMN     "misionTextoHtml" TEXT;
