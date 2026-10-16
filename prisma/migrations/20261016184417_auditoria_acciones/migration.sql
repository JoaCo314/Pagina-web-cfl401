-- Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
-- CreateTable
CREATE TABLE "auditoria_acciones" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "usuarioEmail" TEXT,
    "usuarioNombre" TEXT,
    "rol" TEXT,
    "accion" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "recursoId" INTEGER,
    "resumen" TEXT,
    "detalle" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_acciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_acciones_createdAt_idx" ON "auditoria_acciones"("createdAt");

-- CreateIndex
CREATE INDEX "auditoria_acciones_recurso_idx" ON "auditoria_acciones"("recurso");

-- CreateIndex
CREATE INDEX "auditoria_acciones_usuarioId_idx" ON "auditoria_acciones"("usuarioId");
