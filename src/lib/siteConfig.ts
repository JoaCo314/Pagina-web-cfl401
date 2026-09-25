// Creado por sofia-athos - Configuración editable del sitio (banner, logo, footer, contactos)
import { prisma } from "@/lib/prisma";
import { extraerUrlIframe } from "@/lib/embed";

export type SiteConfigData = {
  id: number;
  bannerPill: string | null;
  bannerTitulo: string | null;
  bannerSubtitulo: string | null;
  bannerImagenUrl: string | null;
  logoUrl: string | null;
  logoAlt: string | null;
  footerCflTitulo: string | null;
  footerCflTexto: string | null;
  footerContactosTitulo: string | null;
  footerEmail: string | null;
  footerTelefono: string | null;
  footerDireccion: string | null;
  footerHorarios: string | null;
  footerCopy: string | null;
  contactoTitulo: string | null;
  contactoSubtitulo: string | null;
  contactoEmail: string | null;
  contactoTelefono: string | null;
  contactoDireccion: string | null;
  contactoHorarios: string | null;
  contactoFormDestinatario: string | null;
  mapaUrl: string | null;
};

const DEFAULTS: Omit<SiteConfigData, "id"> = {
  bannerPill: `Preinscripción ${new Date().getFullYear()} abierta`,
  bannerTitulo: "Capacitate en un oficio, gratis y cerca de casa.",
  bannerSubtitulo: "Cursos presenciales dictados por profesionales. Oferta abierta a la comunidad de Azul.",
  bannerImagenUrl: null,
  logoUrl: "/cfl401azul_logo.jpg",
  logoAlt: "CFL 401 Azul",
  footerCflTitulo: "CFL 401 Azul",
  footerCflTexto: "Cursos y capacitaciones gratuitas para la comunidad de Azul.",
  footerContactosTitulo: "Contacto",
  footerEmail: "cfl401azul@gmail.com",
  footerTelefono: "+54 2281 32-3444",
  footerDireccion: "Azul, Provincia de Buenos Aires",
  footerHorarios: "Lunes a viernes de 8:00 a 12:00 y de 14:00 a 22:00",
  footerCopy: "© 2026 CFL 401 — Azul",
  contactoTitulo: "Contacto",
  contactoSubtitulo: "Escribinos y te respondemos a la brevedad.",
  contactoEmail: "cfl401azul@gmail.com",
  contactoTelefono: "+54 2281 32-3444",
  contactoDireccion: "Azul, Provincia de Buenos Aires",
  contactoHorarios: "Lunes a viernes de 8:00 a 12:00 y de 14:00 a 22:00",
  contactoFormDestinatario: "cfl401azul@gmail.com",
  mapaUrl: null,
};

export async function getSiteConfig(): Promise<SiteConfigData> {
  const config = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  if (!config) return { id: 1, ...DEFAULTS } as SiteConfigData;
  return {
    ...(config as SiteConfigData),
    mapaUrl: config.mapaUrl ? extraerUrlIframe(config.mapaUrl) : null,
  };
}

export async function upsertSiteConfig(data: Partial<Omit<SiteConfigData, "id">>): Promise<SiteConfigData> {
  const entrada = { ...data };
  if (entrada.mapaUrl) {
    entrada.mapaUrl = extraerUrlIframe(entrada.mapaUrl);
  }
  const config = await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: { ...entrada },
    create: { id: 1, ...DEFAULTS, ...entrada },
  });
  return config as SiteConfigData;
}
