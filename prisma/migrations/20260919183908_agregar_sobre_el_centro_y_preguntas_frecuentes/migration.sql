-- CreateTable
CREATE TABLE "sobre_el_centro" (
    "id" SERIAL NOT NULL,
    "intro" TEXT,
    "misionTitulo" TEXT,
    "misionTexto" TEXT,
    "historiaTitulo" TEXT,
    "historiaTexto" TEXT,
    "hitos" JSONB,
    "estadisticas" JSONB,
    "galeria" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sobre_el_centro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_preguntas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas_frecuentes" (
    "id" SERIAL NOT NULL,
    "pregunta" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "orden" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preguntas_frecuentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_preguntas_nombre_key" ON "categorias_preguntas"("nombre");

-- CreateIndex
CREATE INDEX "preguntas_frecuentes_categoriaId_idx" ON "preguntas_frecuentes"("categoriaId");

-- AddForeignKey
ALTER TABLE "preguntas_frecuentes" ADD CONSTRAINT "preguntas_frecuentes_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_preguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
