-- CreateTable
CREATE TABLE "site_config" (
    "id" SERIAL NOT NULL,
    "bannerPill" TEXT,
    "bannerTitulo" TEXT,
    "bannerSubtitulo" TEXT,
    "bannerImagenUrl" TEXT,
    "logoUrl" TEXT,
    "logoAlt" TEXT,
    "footerCflTitulo" TEXT,
    "footerCflTexto" TEXT,
    "footerContactosTitulo" TEXT,
    "footerEmail" TEXT,
    "footerTelefono" TEXT,
    "footerDireccion" TEXT,
    "footerHorarios" TEXT,
    "footerCopy" TEXT,
    "contactoTitulo" TEXT,
    "contactoSubtitulo" TEXT,
    "contactoEmail" TEXT,
    "contactoTelefono" TEXT,
    "contactoDireccion" TEXT,
    "contactoHorarios" TEXT,
    "contactoFormDestinatario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
);
