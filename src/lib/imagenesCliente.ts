import {
  TAMANO_MAXIMO_IMAGEN,
  TIPOS_IMAGEN_PERMITIDOS,
} from "@/lib/imagenesConstantes";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

/// Saca el id de una URL interna `/api/imagenes/<id>`. Se replica acá a propósito
/// en vez de importar desde `@/lib/imagenes`: ese módulo usa Prisma y no se
/// puede arrastrar al bundle del navegador.
function idImagenDesdeUrl(url: string | null | undefined): number | null {
  if (!url) return null;
  const match = /^\/api\/imagenes\/(\d+)$/.exec(url);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/// Valida un archivo elegido en el panel antes de subirlo. Devuelve el mensaje
/// de error o null si es válido.
export function validarArchivoImagen(archivo: File): string | null {
  if (
    !TIPOS_IMAGEN_PERMITIDOS.includes(
      archivo.type as (typeof TIPOS_IMAGEN_PERMITIDOS)[number]
    )
  ) {
    return "Formato no permitido. Se aceptan imágenes JPG, PNG, WEBP o GIF.";
  }
  if (archivo.size === 0) {
    return "El archivo de imagen está vacío.";
  }
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    return "La imagen no puede superar los 5 MB.";
  }
  return null;
}

export type ResultadoSubidaImagen =
  | { ok: true; url: string }
  | { ok: false; error: string };

/// Sube una imagen al servidor y devuelve su URL interna para guardarla en el
/// curso o la noticia.
export async function subirImagen(
  archivo: File
): Promise<ResultadoSubidaImagen> {
  try {
    const form = new FormData();
    form.append("archivo", archivo);

    const res = await fetchConTimeout("/api/imagenes", {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return {
        ok: false,
        error: data?.error ?? "No se pudo subir la imagen.",
      };
    }

    const data = (await res.json()) as { imagen: { url: string } };
    return { ok: true, url: data.imagen.url };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo subir la imagen. Intentá nuevamente.",
    };
  }
}

/// Borra una imagen subida que quedó sin referencia: una foto que se quitó del
/// formulario antes de guardar, o una subida cuyo guardado después falló.
///
/// El servidor vuelve a comprobar que nadie la use, así que llamarlo de más es
/// seguro. Los errores se ignoran a propósito: es limpieza de basura y no vale
/// la pena avisarle a la persona que algo falló atrás.
export async function eliminarImagenHuerfana(
  url: string | null | undefined
): Promise<void> {
  const id = idImagenDesdeUrl(url);
  if (!id) return;
  try {
    await fetchConTimeout(`/api/imagenes/${id}`, { method: "DELETE" });
  } catch {
    // La imagen queda huérfana y se puede borrar desde /panel/imagenes.
  }
}
