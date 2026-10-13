-- Contadores de los limitadores de tasa en la base (antes en memoria del
-- proceso): así el bloqueo se comparte entre réplicas y sobrevive a un reinicio.
CREATE TABLE "rate_limit_intentos" (
    "ambito" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_intentos_pkey" PRIMARY KEY ("ambito","clave")
);
