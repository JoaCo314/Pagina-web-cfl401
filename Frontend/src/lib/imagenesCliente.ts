import {
  TAMANO_MAXIMO_IMAGEN,
  TIPOS_IMAGEN_PERMITIDOS,
} from "@/lib/imagenesConstantes";

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

    const res = await fetch("/api/imagenes", { method: "POST", body: form });
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
  } catch {
    return {
      ok: false,
      error: "No se pudo subir la imagen. Intentá nuevamente.",
    };
  }
}
