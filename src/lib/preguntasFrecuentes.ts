import { limpiarHtmlEnriquecido } from "@/lib/htmlEnriquecido";
import { prisma } from "@/lib/prisma";

/// Selección estándar de una pregunta frecuente para el panel y el sitio.
export const PREGUNTA_SELECT = {
  id: true,
  pregunta: true,
  respuesta: true,
  respuestaHtml: true,
  categoriaId: true,
  orden: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const CATEGORIA_SELECT = {
  id: true,
  nombre: true,
  orden: true,
  activo: true,
} as const;

export type PreguntaFrecuenteInput = {
  pregunta: string;
  respuesta: string;
  respuestaHtml: string | null | undefined;
  categoriaId: number;
  orden: number | null;
  activo?: boolean;
};

export type ResultadoPreguntaInput =
  | { ok: true; datos: PreguntaFrecuenteInput; presentes: string[] }
  | { ok: false; error: string };

function limpiarTexto(
  valor: unknown,
  campo: string,
  max: number,
  obligatorio: boolean
): { error?: string; valor: string | null } {
  if (valor === undefined || valor === null) {
    if (obligatorio) {
      return { error: `Falta el campo obligatorio: ${campo}.`, valor: null };
    }
    return { valor: null };
  }
  if (typeof valor !== "string") {
    return { error: `El campo ${campo} debe ser una cadena de texto.`, valor: null };
  }
  const texto = valor.trim();
  if (!texto) {
    if (obligatorio) {
      return { error: `Falta el campo obligatorio: ${campo}.`, valor: null };
    }
    return { valor: null };
  }
  if (texto.length > max) {
    return { error: `El campo ${campo} no puede superar ${max} caracteres.`, valor: null };
  }
  return { valor: texto };
}

function parsearOrden(valor: unknown): { error?: string; valor: number | null } {
  if (valor === undefined || valor === null || valor === "") {
    return { valor: null };
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0 || numero > 100000) {
    return {
      error: "El orden debe ser un número entero mayor o igual a 0.",
      valor: null,
    };
  }
  return { valor: numero };
}

/// Valida y normaliza el cuerpo de alta/edición de una pregunta frecuente.
/// `presentes` indica qué claves vinieron en el cuerpo (permite a la edición
/// actualizar solo los campos enviados y preservar el resto).
export async function validarPreguntaFrecuente(
  input: unknown,
  { validarCategoria = true }: { validarCategoria?: boolean } = {}
): Promise<ResultadoPreguntaInput> {
  const fuente = (input ?? {}) as Record<string, unknown>;
  const presentes = Object.keys(fuente);

  const pregunta = limpiarTexto(fuente.pregunta, "pregunta", 500, true);
  if (pregunta.error) return { ok: false, error: pregunta.error };

  const respuesta = limpiarTexto(fuente.respuesta, "respuesta", 5000, true);
  if (respuesta.error) return { ok: false, error: respuesta.error };

  /// HTML enriquecido (editor del panel). Opcional; se sanea en el servidor.
  let respuestaHtml: string | null | undefined;
  if (fuente.respuestaHtml !== undefined && fuente.respuestaHtml !== null) {
    const html = limpiarHtmlEnriquecido(fuente.respuestaHtml, "respuestaHtml", 20000);
    if (html.error) return { ok: false, error: html.error };
    respuestaHtml = html.valor;
  } else {
    respuestaHtml = undefined;
  }

  let categoriaId: number | undefined;
  if (fuente.categoriaId !== undefined && fuente.categoriaId !== null && fuente.categoriaId !== "") {
    const id = Number(fuente.categoriaId);
    if (!Number.isInteger(id) || id <= 0) {
      return { ok: false, error: "La categoría elegida no es válida." };
    }
    categoriaId = id;
  }

  if (validarCategoria) {
    if (categoriaId === undefined) {
      return { ok: false, error: "Falta el campo obligatorio: categoría." };
    }
    const categoria = await prisma.categoriaPregunta.findUnique({
      where: { id: categoriaId },
      select: { id: true, activo: true },
    });
    if (!categoria) {
      return { ok: false, error: "La categoría seleccionada no existe." };
    }
    if (!categoria.activo) {
      return { ok: false, error: "No se puede usar una categoría inactiva." };
    }
  }

  const orden = parsearOrden(fuente.orden);
  if (orden.error) return { ok: false, error: orden.error };

  let activo: boolean | undefined;
  if (fuente.activo !== undefined && fuente.activo !== null) {
    if (typeof fuente.activo !== "boolean") {
      return { ok: false, error: "activo debe ser un valor booleano." };
    }
    activo = fuente.activo;
  }

  return {
    ok: true,
    presentes,
    datos: {
      pregunta: pregunta.valor as string,
      respuesta: respuesta.valor as string,
      respuestaHtml,
      categoriaId: categoriaId as number,
      orden: orden.valor,
      activo,
    },
  };
}

/// Valida los datos de una categoría de preguntas frecuentes (crear/editar).
export function validarCategoriaPregunta(
  input: unknown
): { ok: true; valor: string; orden: number | null } | { ok: false; error: string } {
  const fuente = (input ?? {}) as Record<string, unknown>;

  const nombre = limpiarTexto(fuente.nombre, "nombre", 120, true);
  if (nombre.error) return { ok: false, error: nombre.error };

  const orden = parsearOrden(fuente.orden);
  if (orden.error) return { ok: false, error: orden.error };

  return { ok: true, valor: nombre.valor as string, orden: orden.valor };
}

export type CategoriaPreguntaListable = {
  id: number;
  nombre: string;
  orden: number | null;
  activo: boolean;
  preguntas: { id: number; pregunta: string; activo: boolean; orden: number | null }[];
};

/// Categorías con sus preguntas (todas, incluidas inactivas) para el panel.
export async function obtenerCategoriasPanel(): Promise<CategoriaPreguntaListable[]> {
  const categorias = await prisma.categoriaPregunta.findMany({
    select: {
      id: true,
      nombre: true,
      orden: true,
      activo: true,
      preguntas: {
        select: { id: true, pregunta: true, activo: true, orden: true },
        orderBy: [{ orden: "asc" }, { pregunta: "asc" }],
      },
    },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });
  return categorias;
}