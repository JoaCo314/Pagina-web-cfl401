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

/// Borra una imagen administrada a partir de su URL interna. Es una limpieza de
/// mejor esfuerzo: si la URL es externa o la imagen ya no existe, no hace nada.
export async function borrarImagenPorUrl(
  url: string | null | undefined
): Promise<void> {
  const id = idImagenDesdeUrl(url);
  if (!id) return;
  try {
    await prisma.imagen.delete({ where: { id } });
  } catch {
    // La imagen pudo haber sido eliminada antes; el borrado es best-effort.
  }
}
