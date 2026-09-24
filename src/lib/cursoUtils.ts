export type Docente = { id: number; nombre: string; apellido: string };

/// Ícono de un curso: usa el emoji cargado desde el panel si existe; si no,
/// deriva uno automático según la categoría.
export function iconoCurso(emoji: string | null | undefined, categoria: string | null | undefined): string {
  const propio = (emoji ?? "").trim();
  if (propio) return propio;
  return iconoCategoria(categoria ?? null);
}

export function iconoCategoria(categoria: string | null): string {
  const texto = (categoria ?? "").toLowerCase();
  if (/(inform|tecnolog|robot|comput)/.test(texto)) return "🤖";
  if (/(gastronom|panader|cocina)/.test(texto)) return "🍞";
  if (/(electric|oficio|mecan)/.test(texto)) return "🔌";
  if (/(administr|comerc|pyme|contab)/.test(texto)) return "📊";
  if (/(carpinter|madera)/.test(texto)) return "🪵";
  if (/(textil|indumentaria|costur)/.test(texto)) return "🧵";
  return "📘";
}

export function formatearFecha(fecha: string | null): string {
  if (!fecha) return "A confirmar";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function nombresDocentes(docentes: { docente: Docente }[]): string {
  if (docentes.length === 0) return "A definir";
  return docentes
    .map((d) => `${d.docente.nombre} ${d.docente.apellido}`)
    .join(", ");
}