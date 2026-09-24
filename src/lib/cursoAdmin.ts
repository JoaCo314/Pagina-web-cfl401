import { limpiarHtmlEnriquecido } from "@/lib/htmlEnriquecido";
import { prisma } from "@/lib/prisma";
import { validarImagenUrl } from "@/lib/imagenes";

/// Selección estándar de un curso para respuestas del panel (con docentes).
export const CURSO_SELECT = {
  id: true,
  nombre: true,
  descripcion: true,
  modalidad: true,
  horarios: true,
  mesesCursada: true,
  fechaInicio: true,
  fechaFin: true,
  sede: true,
  enlaceInscripcion: true,
  programaContenidos: true,
  programaContenidosHtml: true,
  categoria: true,
  emoji: true,
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
  fechaFin: Date | null;
  sede: string | null;
  enlaceInscripcion: string | null;
  programaContenidos: string | null;
  programaContenidosHtml: string | null | undefined;
  categoria: string | null;
  emoji: string | null;
  cupos: number | null;
  imagenUrl: string | null;
  informacionAdicional: string | null;
  activo?: boolean;
  docenteIds: number[];
};

export type DocenteActivo = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
};

export async function obtenerDocentesActivos(): Promise<DocenteActivo[]> {
  return prisma.usuario.findMany({
    where: { activo: true, rol: { nombre: "Docente" } },
    select: { id: true, nombre: true, apellido: true, email: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
}

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
  valor: unknown,
  campo = "fechaInicio"
): { error?: string; valor: Date | null } {
  if (valor === undefined || valor === null || valor === "") {
    return { valor: null };
  }
  if (typeof valor !== "string") {
    return { error: `${campo} debe ser una fecha válida.`, valor: null };
  }
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return { error: `El campo ${campo} contiene una fecha inválida.`, valor: null };
  }
  return { valor: fecha };
}

/// Valida el enlace externo de inscripción (página del IPFL). Debe ser una URL
/// http(s) absoluta; una cadena vacía lo deja sin definir.
function parsearEnlaceInscripcion(
  valor: unknown
): { error?: string; valor: string | null } {
  const texto = limpiarTexto(valor);
  if (texto.error) return { error: texto.error, valor: null };
  if (!texto.valor) return { valor: null };
  if (!/^https?:\/\/\S+$/i.test(texto.valor)) {
    return {
      error:
        "El link de inscripción debe ser una URL completa que empiece con http:// o https://.",
      valor: null,
    };
  }
  return { valor: texto.valor };
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

/// Emoji/ícono opcional del curso. Se guarda tal cual si viene; si está vacío,
/// el sitio usa el ícono automático según la categoría (fallback).
function parsearEmoji(
  valor: unknown
): { error?: string; valor: string | null } {
  if (valor === undefined || valor === null) return { valor: null };
  if (typeof valor !== "string") {
    return { error: "El ícono debe ser un texto.", valor: null };
  }
  const texto = valor.trim();
  if (!texto) return { valor: null };
  if (texto.length > 16) {
    return { error: "El ícono no puede superar 16 caracteres.", valor: null };
  }
  return { valor: texto };
}

export type ResultadoListaDocentes =
  | { ok: true; ids: number[] }
  | { ok: false; error: string };

/// Valida una lista de IDs de docentes para asignar a un curso (RF-11/RF-12).
/// Solo se aceptan usuarios existentes, activos y con rol Docente. Devuelve los
/// IDs únicos y válidos; una lista vacía es válida (desasignar todos).
export async function validarListaDocentes(
  valor: unknown
): Promise<ResultadoListaDocentes> {
  if (valor === undefined || valor === null) {
    return { ok: true, ids: [] };
  }
  if (!Array.isArray(valor)) {
    return { ok: false, error: "docenteIds debe ser una lista de usuarios." };
  }
  const ids = valor
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length !== valor.length) {
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
  return { ok: true, ids: Array.from(new Set(ids)) };
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
  /// HTML enriquecido (editor del panel). Opcional; se sanea en el servidor.
  let programaContenidosHtml: string | null | undefined;
  if (
    fuente.programaContenidosHtml !== undefined &&
    fuente.programaContenidosHtml !== null
  ) {
    const html = limpiarHtmlEnriquecido(
      fuente.programaContenidosHtml,
      "programaContenidosHtml",
      4000
    );
    if (html.error) return { ok: false, error: html.error };
    programaContenidosHtml = html.valor;
  } else {
    programaContenidosHtml = undefined;
  }
  const categoria = limpiarTexto(fuente.categoria);
  const emoji = parsearEmoji(fuente.emoji);
  const imagenUrl = validarImagenUrl(fuente.imagenUrl);
  const informacionAdicional = limpiarTexto(fuente.informacionAdicional);
  const sede = limpiarTexto(fuente.sede);

  const textos = [
    ["descripcion", descripcion],
    ["modalidad", modalidad],
    ["horarios", horarios],
    ["mesesCursada", mesesCursada],
    ["programaContenidos", programaContenidos],
    ["categoria", categoria],
    ["emoji", emoji],
    ["imagenUrl", imagenUrl],
    ["informacionAdicional", informacionAdicional],
    ["sede", sede],
  ] as const;
  for (const [campo, resultado] of textos) {
    if (resultado.error) {
      return { ok: false, error: `${campo}: ${resultado.error}` };
    }
  }

  const fechaInicio = parsearFecha(fuente.fechaInicio);
  if (fechaInicio.error) return { ok: false, error: fechaInicio.error };

  const fechaFin = parsearFecha(fuente.fechaFin, "fechaFin");
  if (fechaFin.error) return { ok: false, error: fechaFin.error };

  const enlaceInscripcion = parsearEnlaceInscripcion(fuente.enlaceInscripcion);
  if (enlaceInscripcion.error) {
    return { ok: false, error: enlaceInscripcion.error };
  }

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

  const listaDocentes = await validarListaDocentes(fuente.docenteIds);
  if (!listaDocentes.ok) {
    return { ok: false, error: listaDocentes.error };
  }
  const docenteIds = listaDocentes.ids;

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
      fechaFin: fechaFin.valor,
      sede: sede.valor,
      enlaceInscripcion: enlaceInscripcion.valor,
      programaContenidos: programaContenidos.valor,
      programaContenidosHtml,
      categoria: categoria.valor,
      emoji: emoji.valor,
      cupos: cupos.valor,
      imagenUrl: imagenUrl.valor,
      informacionAdicional: informacionAdicional.valor,
      activo,
      docenteIds,
    },
  };
}