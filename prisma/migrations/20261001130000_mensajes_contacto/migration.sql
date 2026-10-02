-- Consultas del formulario público de /contacto. Quedan en la base y el
-- Administrador las lee desde el panel (antes se perdían: la API solo
-- respondía "ok" sin guardar nada).
CREATE TABLE "mensajes_contacto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "curso" TEXT,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mensajes_contacto_pkey" PRIMARY KEY ("id")
);

-- El listado del panel ordena por fecha desc y filtra por leido.
CREATE INDEX "mensajes_contacto_leido_idx" ON "mensajes_contacto"("leido");
CREATE INDEX "mensajes_contacto_createdAt_idx" ON "mensajes_contacto"("createdAt");