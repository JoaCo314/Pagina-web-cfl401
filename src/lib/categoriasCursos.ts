// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { prisma } from "@/lib/prisma";

/// Selección estándar de una categoría de curso para el panel.
export const CATEGORIA_CURSO_SELECT = {
  id: true,
  nombre: true,
  orden: true,
  activo: true,
} as const;

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

/// Valida los datos de una categoría de curso (crear/editar).
export function validarCategoriaCurso(
  input: unknown
): { ok: true; valor: string; orden: number | null } | { ok: false; error: string } {
  const fuente = (input ?? {}) as Record<string, unknown>;

  const nombre = limpiarTexto(fuente.nombre, "nombre", 120, true);
  if (nombre.error) return { ok: false, error: nombre.error };

  const orden = parsearOrden(fuente.orden);
  if (orden.error) return { ok: false, error: orden.error };

  return { ok: true, valor: nombre.valor as string, orden: orden.valor };
}

export type CategoriaCursoListable = {
  id: number;
  nombre: string;
  orden: number | null;
  activo: boolean;
  cursos: number;
};

/// Categorías con la cantidad de cursos que las usan (para el panel).
export async function obtenerCategoriasCursosPanel(): Promise<
  CategoriaCursoListable[]
> {
  const categorias = await prisma.categoriaCurso.findMany({
    select: {
      id: true,
      nombre: true,
      orden: true,
      activo: true,
      _count: { select: { cursos: true } },
    },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });
  return categorias.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    orden: c.orden,
    activo: c.activo,
    cursos: c._count.cursos,
  }));
}
