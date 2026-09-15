import { prisma } from "@/lib/prisma";

/// Selección estándar de un curso para respuestas del panel (con docentes).
export const CURSO_SELECT = {
  id: true,
  nombre: true,
  descripcion: true,
  modalidad: true,
  horarios: true,
  mesesCursada: true,
  fechaInicio: true,
  programaContenidos: true,
  categoria: true,
  cupos: true,
  imagenUrl: true,
  informacionAdicional: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
  docentes: {
    include: {
      docente: { select: { id: true, nombre: true, apellido: true } },
    },
  },
} as const;

export type CursoInputNormalizado = {
  nombre: string;
  descripcion: string | null;
  modalidad: string | null;
  horarios: string | null;
  mesesCursada: string | null;
  fechaInicio: Date | null;
  programaContenidos: string | null;
  categoria: string | null;
  cupos: number | null;
  imagenUrl: string | null;
  informacionAdicional: string | null;
  activo?: boolean;
  docenteIds: number[];
};

export type ResultadoCursoInput =
  | { ok: true; datos: CursoInputNormalizado; presentes: string[] }
  | { ok: false; error: string };

function limpiarTexto(
  valor: unknown
): { error?: string; valor: string | null } {
  if (valor === undefined || valor === null) return { valor: null };
  if (typeof valor !== "string") {
    return { error: "Los campos de texto deben ser cadenas.", valor: null };
  }
  const texto = valor.trim();
  if (!texto) return { valor: null };
  if (texto.length > 1000) {
    return { error: "Los campos de texto no pueden superar 1000 caracteres.", valor: null };
  }
  return { valor: texto };
}

function parsearFecha(
  valor: unknown
): { error?: string; valor: Date | null } {
  if (valor === undefined || valor === null || valor === "") {
    return { valor: null };
  }
  if (typeof valor !== "string") {
    return { error: "fechaInicio debe ser una fecha válida.", valor: null };
  }
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return { error: "Fecha de inicio inválida.", valor: null };
  }
  return { valor: fecha };
}

function parsearCupos(
  valor: unknown
): { error?: string; valor: number | null } {
  if (valor === undefined || valor === null || valor === "") {
    return { valor: null };
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0 || numero > 100000) {
    return { error: "Cupos debe ser un número entero mayor o igual a 0.", valor: null };
  }
  return { valor: numero };
}

/// Valida y normaliza el cuerpo de alta/edición de un curso (RF-08/RF-09).
/// `presentes` indica qué claves vino en el cuerpo (permite a la edición
/// actualizar solo los campos enviados y preservar el resto).
/// Docentes: solo se aceptan usuarios existentes, activos y con rol Docente.
export async function validarDatosCurso(
  input: unknown
): Promise<ResultadoCursoInput> {
  const fuente = (input ?? {}) as Record<string, unknown>;
  const presentes = Object.keys(fuente);

  const nombre = limpiarTexto(fuente.nombre);
  if (nombre.error) return { ok: false, error: nombre.error };
  if (!nombre.valor) {
    return { ok: false, error: "Falta el campo obligatorio: nombre." };
  }
  if (nombre.valor.length > 200) {
    return { ok: false, error: "El nombre del curso no puede superar 200 caracteres." };
  }

  const descripcion = limpiarTexto(fuente.descripcion);
  const modalidad = limpiarTexto(fuente.modalidad);
  const horarios = limpiarTexto(fuente.horarios);
  const mesesCursada = limpiarTexto(fuente.mesesCursada);
  const programaContenidos = limpiarTexto(fuente.programaContenidos);
  const categoria = limpiarTexto(fuente.categoria);
  const imagenUrl = limpiarTexto(fuente.imagenUrl);
  const informacionAdicional = limpiarTexto(fuente.informacionAdicional);

  const textos = [
    ["descripcion", descripcion],
    ["modalidad", modalidad],
    ["horarios", horarios],
    ["mesesCursada", mesesCursada],
    ["programaContenidos", programaContenidos],
    ["categoria", categoria],
    ["imagenUrl", imagenUrl],
    ["informacionAdicional", informacionAdicional],
  ] as const;
  for (const [campo, resultado] of textos) {
    if (resultado.error) {
      return { ok: false, error: `${campo}: ${resultado.error}` };
    }
  }

  const fechaInicio = parsearFecha(fuente.fechaInicio);
  if (fechaInicio.error) return { ok: false, error: fechaInicio.error };

  const cupos = parsearCupos(fuente.cupos);
  if (cupos.error) return { ok: false, error: cupos.error };

  let activo: boolean | undefined;
  if (
    fuente.activo !== undefined &&
    fuente.activo !== null
  ) {
    if (typeof fuente.activo !== "boolean") {
      return { ok: false, error: "activo debe ser un valor booleano." };
    }
    activo = fuente.activo;
  }

  let docenteIds: number[] = [];
  if (fuente.docenteIds !== undefined && fuente.docenteIds !== null) {
    if (!Array.isArray(fuente.docenteIds)) {
      return { ok: false, error: "docenteIds debe ser una lista de usuarios." };
    }
    const ids = fuente.docenteIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);
    if (ids.length !== fuente.docenteIds.length) {
      return { ok: false, error: "La lista de docentes contiene IDs inválidos." };
    }
    const docentes = await prisma.usuario.findMany({
      where: {
        id: { in: ids },
        activo: true,
        rol: { nombre: "Docente" },
      },
      select: { id: true },
    });
    if (docentes.length !== ids.length) {
      return {
        ok: false,
        error: "Uno o varios docentes no existen, están desactivados o no tienen rol Docente.",
      };
    }
    docenteIds = Array.from(new Set(ids));
  }

  return {
    ok: true,
    presentes,
    datos: {
      nombre: nombre.valor,
      descripcion: descripcion.valor,
      modalidad: modalidad.valor,
      horarios: horarios.valor,
      mesesCursada: mesesCursada.valor,
      fechaInicio: fechaInicio.valor,
      programaContenidos: programaContenidos.valor,
      categoria: categoria.valor,
      cupos: cupos.valor,
      imagenUrl: imagenUrl.valor,
      informacionAdicional: informacionAdicional.valor,
      activo,
      docenteIds,
    },
  };
}