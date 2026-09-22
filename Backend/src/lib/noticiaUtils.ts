export type Noticia = {
  id: number;
  titulo: string;
  resumen: string | null;
  contenido: string;
  fecha: string;
  imagenUrl: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

/// Fecha en formato largo en español (ej. "12 de agosto de 2026"). Se usa UTC
/// para evitar el corrimiento de un día según la zona horaria del servidor.
export function formatearFechaLarga(fecha: string | Date): string {
  const date = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/// Divide el contenido en párrafos: cada bloque separado por uno o más
/// renglones en blanco se muestra como un párrafo independiente. Los saltos de
/// línea simples dentro de un bloque se conservan vía `white-space: pre-line`.
export function dividirParrafos(contenido: string): string[] {
  return contenido
    .split(/\n\s*\n/)
    .map((parrafo) => parrafo.trim())
    .filter(Boolean);
}
