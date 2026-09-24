import { limpiarHtmlEnriquecido } from "@/lib/htmlEnriquecido";
export { limpiarHtmlEnriquecido };
import { validarImagenUrl } from "@/lib/imagenes";

/// Selección estándar de una noticia para respuestas de la API y del panel.
export const NOTICIA_SELECT = {
  id: true,
  titulo: true,
  resumen: true,
  contenido: true,
  contenidoHtml: true,
  fecha: true,
  imagenUrl: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type NoticiaInputNormalizado = {
  titulo: string;
  resumen: string | null;
  contenido: string;
  contenidoHtml: string | null | undefined;
  fecha: Date;
  imagenUrl: string | null;
  activo: boolean;
};

export type ResultadoNoticiaInput =
  | { ok: true; datos: NoticiaInputNormalizado; presentes: string[] }
  | { ok: false; error: string };

function limpiarTexto(
  valor: unknown,
  campo: string,
  max: number
): { error?: string; valor: string | null } {
  if (valor === undefined || valor === null) return { valor: null };
  if (typeof valor !== "string") {
    return { error: `El campo ${campo} debe ser una cadena de texto.`, valor: null };
  }
  const texto = valor.trim();
  if (!texto) return { valor: null };
  if (texto.length > max) {
    return {
      error: `El campo ${campo} no puede superar ${max} caracteres.`,
      valor: null,
    };
  }
  return { valor: texto };
}

/// El campo es obligatorio: no se acepta vacío, nulo ni ausente.
function limpiarTextoObligatorio(
  valor: unknown,
  campo: string,
  max: number
): { error?: string; valor: string | null } {
  if (valor === undefined || valor === null) {
    return { error: `Falta el campo obligatorio: ${campo}.`, valor: null };
  }
  if (typeof valor !== "string") {
    return { error: `El campo ${campo} debe ser una cadena de texto.`, valor: null };
  }
  const texto = valor.trim();
  if (!texto) {
    return { error: `Falta el campo obligatorio: ${campo}.`, valor: null };
  }
  if (texto.length > max) {
    return {
      error: `El campo ${campo} no puede superar ${max} caracteres.`,
      valor: null,
    };
  }
  return { valor: texto };
}

/// La fecha de publicación es obligatoria y debe ser una fecha válida.
function parsearFecha(valor: unknown): { error?: string; valor: Date | null } {
  if (valor === undefined || valor === null || valor === "") {
    return { error: "Falta el campo obligatorio: fecha.", valor: null };
  }
  if (typeof valor !== "string" && !(valor instanceof Date)) {
    return { error: "La fecha de publicación debe ser una fecha válida.", valor: null };
  }
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return {
      error: "La fecha de publicación contiene una fecha inválida.",
      valor: null,
    };
  }
  return { valor: fecha };
}

/// La imagen es opcional; se valida con `validarImagenUrl` (subida o URL).

/// Valida y normaliza el cuerpo de alta/edición de una noticia. `presentes`
/// indica qué claves vinieron en el cuerpo, de modo que la edición pueda
/// actualizar solo los campos enviados y preservar el resto.
export function validarDatosNoticia(input: unknown): ResultadoNoticiaInput {
  const fuente = (input ?? {}) as Record<string, unknown>;
  const presentes = Object.keys(fuente);

  const titulo = limpiarTextoObligatorio(fuente.titulo, "titulo", 200);
  if (titulo.error) return { ok: false, error: titulo.error };

  const contenido = limpiarTextoObligatorio(
    fuente.contenido,
    "contenido",
    20000
  );
  if (contenido.error) return { ok: false, error: contenido.error };

  const resumen = limpiarTexto(fuente.resumen, "resumen", 300);
  if (resumen.error) return { ok: false, error: resumen.error };

  const fecha = parsearFecha(fuente.fecha);
  if (fecha.error) return { ok: false, error: fecha.error };

  const imagenUrl = validarImagenUrl(fuente.imagenUrl);
  if (imagenUrl.error) return { ok: false, error: imagenUrl.error };

  let activo: boolean | undefined;
  if (fuente.activo !== undefined && fuente.activo !== null) {
    if (typeof fuente.activo !== "boolean") {
      return { ok: false, error: "activo debe ser un valor booleano." };
    }
    activo = fuente.activo;
  }

  /// HTML enriquecido (editor del panel). Opcional; se sanea en el servidor.
  let contenidoHtml: string | null | undefined;
  if (fuente.contenidoHtml !== undefined && fuente.contenidoHtml !== null) {
    const html = limpiarHtmlEnriquecido(fuente.contenidoHtml, "contenidoHtml", 50000);
    if (html.error) return { ok: false, error: html.error };
    contenidoHtml = html.valor;
  } else {
    contenidoHtml = undefined;
  }

  return {
    ok: true,
    presentes,
    datos: {
      titulo: titulo.valor as string,
      resumen: resumen.valor,
      contenido: contenido.valor as string,
      contenidoHtml,
      fecha: fecha.valor as Date,
      imagenUrl: imagenUrl.valor,
      activo: activo === true,
    },
  };
}
