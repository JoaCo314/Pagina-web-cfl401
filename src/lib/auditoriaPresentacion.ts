// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).

/// Tipos y etiquetas para presentar la auditoría en el panel. Módulo puro (sin
/// prisma ni dependencias de servidor) para que el componente de tabla, que es
/// un componente cliente, pueda importarlo.

export type RegistroAuditoriaUI = {
  id: number;
  createdAt: string;
  accion: string;
  recurso: string;
  recursoId: number | null;
  usuarioNombre: string | null;
  usuarioEmail: string | null;
  rol: string | null;
  resumen: string | null;
  ip: string | null;
  /// Contenido JSON del registro, si guardó datos. Siempre plano (serializable
  /// para pasarlo de un componente servidor a uno cliente).
  detalle: Record<string, unknown> | null;
};

/// Nombres de categorías para traducir los `categoriaId` del detalle a algo
/// legible, sin volver a consultar en el cliente.
export type NombresCategorias = {
  cursos: Record<string, string>;
  preguntas: Record<string, string>;
};

export const ETIQUETAS_CAMPO: Record<string, string> = {
  activo: "Activo",
  campos: "Campos modificados",
  cantidad: "Cantidad",
  categoria: "Categoría",
  categoriaId: "Categoría",
  cupos: "Cupos",
  cursosDesasignados: "Cursos desasignados",
  desbloqueo: "Desbloqueo",
  descripcion: "Descripción",
  docentes: "Docentes",
  email: "Correo electrónico",
  emoji: "Emoji",
  enlaceInscripcion: "Enlace de inscripción",
  fechaFin: "Fecha de fin",
  fechaInicio: "Fecha de inicio",
  horarios: "Horarios",
  imagenUrl: "Imagen",
  informacionAdicional: "Información adicional",
  mesesCursada: "Meses de cursada",
  modalidad: "Modalidad",
  motivo: "Motivo",
  nombre: "Nombre",
  programaContenidos: "Programa de contenidos",
  programaContenidosHtml: "Programa de contenidos (HTML)",
  rol: "Rol",
  sede: "Sede",
};

const ZONA = "America/Argentina/Buenos_Aires";

const formatoFechaHora = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: ZONA,
});

const formatoDia = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: ZONA,
});
const formatoHora = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: ZONA,
});

function aFecha(valor: Date | string): Date | null {
  const fecha = typeof valor === "string" ? new Date(valor) : valor;
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/// Fecha completa para el detalle: «17 oct 2026, 20:44».
export function fechaCompleta(valor: Date | string): string {
  const fecha = aFecha(valor);
  return fecha ? formatoFechaHora.format(fecha) : "—";
}

/// Fecha compacta para la tabla: «17 oct. 2026 · 20:44».
export function fechaCompacta(valor: Date | string): string {
  const fecha = aFecha(valor);
  if (!fecha) return "—";
  const partes = formatoDia.formatToParts(fecha);
  const dia = partes.find((p) => p.type === "day")?.value ?? "";
  const mesBruto = partes.find((p) => p.type === "month")?.value ?? "";
  const mes = mesBruto.replace(/\.$/, "");
  const anio = partes.find((p) => p.type === "year")?.value ?? "";
  return `${dia} ${mes}. ${anio} · ${formatoHora.format(fecha)}`;
}

const ES_FECHA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/// Vuelve legible un valor guardado en el `detalle`: booleanos a Sí/No, fechas
/// ISO a fecha argentina, listas simples a texto y vacíos a «Sin valor».
export function formatearValorAuditoria(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "Sin valor";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "number") return String(valor);
  if (typeof valor === "string") {
    return ES_FECHA_ISO.test(valor) ? fechaCompacta(valor) : valor;
  }
  if (Array.isArray(valor)) {
    if (valor.length === 0) return "Sin valor";
    const simples = valor.every(
      (v) =>
        typeof v === "string" || typeof v === "number" || typeof v === "boolean"
    );
    return simples
      ? valor.map((v) => String(v)).join(", ")
      : JSON.stringify(valor);
  }
  return JSON.stringify(valor);
}

/// Etiqueta de un campo del detalle; si no está mapeada usa la clave tal cual.
export function etiquetaCampoAuditoria(clave: string): string {
  return ETIQUETAS_CAMPO[clave] ?? clave;
}

/// Valor de un campo del detalle con la traducción especial de `categoriaId`
/// (que llega como número y se resuelve al nombre de la categoría).
export function formatearCampoAuditoria(
  registro: RegistroAuditoriaUI,
  clave: string,
  valor: unknown,
  categorias: NombresCategorias
): string {
  if (clave === "categoriaId" && (typeof valor === "number" || typeof valor === "string")) {
    const mapa =
      registro.recurso === "curso"
        ? categorias.cursos
        : registro.recurso === "pregunta"
          ? categorias.preguntas
          : null;
    const nombre = mapa?.[String(valor)];
    if (nombre) return `${nombre} (id ${String(valor)})`;
  }
  return formatearValorAuditoria(valor);
}

/// Nombres de los campos que cambió una edición (clave `campos` del detalle).
export function camposModificadosAuditoria(
  registro: RegistroAuditoriaUI
): string[] {
  const crudo = registro.detalle?.campos;
  if (typeof crudo === "string") {
    return crudo
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }
  if (Array.isArray(crudo)) return crudo.map(String);
  return [];
}

/// Entradas del detalle en orden de lectura: los campos modificados primero
/// (en el orden en que se listan) y el resto después. La clave `campos` no
/// aporta valor, solo los nombres, así que se omite de la lista.
export function entradasDetalleAuditoria(
  registro: RegistroAuditoriaUI
): [string, unknown][] {
  if (!registro.detalle) return [];
  const entradas = Object.entries(registro.detalle).filter(
    ([clave]) => clave !== "campos"
  );
  const modificados = camposModificadosAuditoria(registro);
  if (modificados.length === 0) return entradas;
  const peso = new Map(modificados.map((nombre, i) => [nombre, i]));
  const mencionadas = entradas
    .filter(([clave]) => peso.has(clave))
    .sort(([a], [b]) => peso.get(a)! - peso.get(b)!);
  const resto = entradas.filter(([clave]) => !peso.has(clave));
  return [...mencionadas, ...resto];
}
