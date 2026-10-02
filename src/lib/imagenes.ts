import { prisma } from "@/lib/prisma";

export {
  TAMANO_MAXIMO_IMAGEN,
  TIPOS_IMAGEN_PERMITIDOS,
} from "@/lib/imagenesConstantes";

export function urlImagenInterna(id: number): string {
  return `/api/imagenes/${id}`;
}

/// Extrae el id de una URL interna de imagen (`/api/imagenes/<id>`), o null si
/// la URL es externa, vacía o no corresponde a una imagen administrada.
export function idImagenDesdeUrl(url: string | null | undefined): number | null {
  if (!url) return null;
  const match = /^\/api\/imagenes\/(\d+)$/.exec(url);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/// Valida el campo imagenUrl de cursos y noticias. Acepta vacío (sin imagen),
/// una URL externa http(s) heredada, o una URL interna `/api/imagenes/<id>`.
export function validarImagenUrl(
  valor: unknown
): { error?: string; valor: string | null } {
  if (valor === undefined || valor === null) return { valor: null };
  if (typeof valor !== "string") {
    return { error: "La imagen debe ser una URL válida.", valor: null };
  }
  const texto = valor.trim();
  if (!texto) return { valor: null };
  if (texto.length > 1000) {
    return { error: "La URL de la imagen no puede superar 1000 caracteres.", valor: null };
  }
  if (/^https?:\/\/\S+$/i.test(texto) || /^\/api\/imagenes\/\d+$/.test(texto)) {
    return { valor: texto };
  }
  return {
    error:
      "La imagen debe ser un archivo subido desde el panel o una URL http(s) válida.",
    valor: null,
  };
}

/// Lista los lugares del sitio que siguen apuntando a una imagen administra.
/// Devuelve descripciones legibles para poder armar el mensaje de error.
///
/// Considera cursos, noticias, el banner y el logo de la configuración y la
/// galería de "Sobre el centro". La galería viene guardada como JSON, así que no
/// se puede filtrar en SQL: se lee y se busca.
export async function referenciasImagen(id: number): Promise<string[]> {
  const url = urlImagenInterna(id);

  const [curso, noticia, banner, logo, sobreElCentro] = await Promise.all([
    prisma.curso.findFirst({ where: { imagenUrl: url }, select: { id: true } }),
    prisma.noticia.findFirst({ where: { imagenUrl: url }, select: { id: true } }),
    prisma.siteConfig.findFirst({
      where: { bannerImagenUrl: url },
      select: { id: true },
    }),
    prisma.siteConfig.findFirst({
      where: { logoUrl: url },
      select: { id: true },
    }),
    prisma.sobreElCentro.findMany({ select: { galeria: true } }),
  ]);

  const usos: string[] = [];
  if (curso) usos.push("un curso");
  if (noticia) usos.push("una noticia");
  if (banner) usos.push("el banner de la portada");
  if (logo) usos.push("el logo");
  if (
    sobreElCentro.some((fila) => {
      const galeria = fila.galeria;
      if (!Array.isArray(galeria)) return false;
      return galeria.some(
        (foto) =>
          typeof foto === "object" &&
          foto !== null &&
          (foto as { url?: unknown }).url === url
      );
    })
  ) {
    usos.push("la galería de “Sobre el centro”");
  }

  return usos;
}

/// ¿Algún contenido del sitio sigue apuntando a esta imagen?
export async function imagenEstaEnUso(id: number): Promise<boolean> {
  return (await referenciasImagen(id)).length > 0;
}

/// Borra una imagen administrada a partir de su URL interna, pero solo si ya no
/// está en uso en ninguna parte del sitio.
///
/// La comprobación es obligatoria: la misma imagen subida una vez puede estar
/// referenciada por el logo y por un curso, o por dos fotos de la galería. Sin
/// esto, guardar el logo dejaba apuntando a una imagen inexistente en el curso
/// que la usaba.
///
/// Es una limpieza de mejor esfuerzo: si la URL es externa o la imagen ya no
/// existe, no hace nada.
export async function borrarImagenPorUrl(
  url: string | null | undefined
): Promise<boolean> {
  const id = idImagenDesdeUrl(url);
  if (!id) return false;

  try {
    if (await imagenEstaEnUso(id)) return false;
    await prisma.imagen.delete({ where: { id } });
    return true;
  } catch {
    // La imagen pudo haber sido eliminada antes; el borrado es best-effort.
    return false;
  }
}
