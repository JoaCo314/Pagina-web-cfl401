/// Metadatos compartidos del sitio (SEO). Un solo lugar para el nombre, la
/// descripción y la URL base, así las páginas no repiten estos datos y el
/// sitemap/robots no se desincronizan del layout.

export const NOMBRE_SITIO = "CFL 401 Azul";

export const DEFAULT_TITLE = "CFL 401 Azul — Formación Profesional";

export const DESCRIPCION_SITIO =
  "Centro de Formación Laboral N° 401 de Azul (Buenos Aires). Cursos de formación profesional gratuitos y con validez oficial, noticias e inscripciones.";

/// URL base del sitio para metadatos, sitemap y robots. En producción se define
/// `SITE_URL` (ej: https://cfl401.ejemplo.edu.ar); por defecto apunta al local.
export function urlSitio(): string {
  return (process.env.SITE_URL ?? "http://localhost:4088").replace(/\/+$/, "");
}

/// Convierte HTML del panel en una descripción de texto plano (una línea) para
/// los meta tags: los motores no muestran etiquetas, así que se las quita.
export function textoParaMeta(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}