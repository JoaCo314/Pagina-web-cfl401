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
  mapaTitulo: string | null;
  mapaSubtitulo: string | null;
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
  mapaTitulo: "¿Dónde estamos?",
  mapaSubtitulo: "Azul, Provincia de Buenos Aires · Lunes a viernes de 8:00 a 12:00 y de 14:00 a 22:00",
};

export async function getSiteConfig(): Promise<SiteConfigData> {
  const config = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  if (!config) return { id: 1, ...DEFAULTS } as SiteConfigData;
  return {
    ...(config as SiteConfigData),
    mapaUrl: config.mapaUrl ? extraerUrlIframe(config.mapaUrl) : null,
  };
}

/// Normaliza y valida el mapa de la portada. Acepta un iframe de Google Maps
/// completo o una URL http(s) absoluta; vacío lo deja sin definir. Cualquier
/// otro esquema (javascript:, data:, etc.) se rechaza en el servidor.
export function normalizarUrlMapa(
  valor: unknown
): { error?: string; valor: string | null } {
  if (valor === undefined || valor === null) return { valor: null };
  if (typeof valor !== "string") {
    return { error: "mapaUrl debe ser texto.", valor: null };
  }
  const extraido = extraerUrlIframe(valor.trim());
  if (!extraido) return { valor: null };
  if (extraido.length > 2000) {
    return { error: "La URL del mapa es demasiado larga.", valor: null };
  }
  if (!/^https?:\/\/\S+$/i.test(extraido)) {
    return {
      error:
        "El mapa debe ser un iframe de Google Maps o una URL que empiece con http:// o https://.",
      valor: null,
    };
  }
  return { valor: extraido };
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
