import { validarImagenUrl } from "@/lib/imagenes";

/// Selección estándar del contenido de "Sobre el centro".
export const SOBRE_SELECT = {
  id: true,
  intro: true,
  misionTitulo: true,
  misionTexto: true,
  historiaTitulo: true,
  historiaTexto: true,
  hitos: true,
  estadisticasTitulo: true,
  estadisticas: true,
  galeriaTitulo: true,
  galeria: true,
  activo: true,
  updatedAt: true,
} as const;

export type Hito = { anio: string; titulo: string; texto: string };
export type Estadistica = { valor: string; etiqueta: string };
export type FotoGaleria = { url: string; leyenda: string };

export type SobreElCentroDatos = {
  intro: string | null;
  misionTitulo: string | null;
  misionTexto: string | null;
  historiaTitulo: string | null;
  historiaTexto: string | null;
  hitos: Hito[] | null;
  estadisticasTitulo: string | null;
  estadisticas: Estadistica[] | null;
  galeriaTitulo: string | null;
  galeria: FotoGaleria[] | null;
  activo?: boolean;
};

export type ResultadoSobreElCentro =
  | { ok: true; datos: SobreElCentroDatos }
  | { ok: false; error: string };

const MAX_TITULO = 200;
const MAX_TEXTO = 5000;
const MAX_HITOS = 50;
const MAX_ESTADISTICAS = 12;
const MAX_GALERIA = 24;

/// Parsea con límites de seguridad un JSON guardado en la BD (mejor esfuerzo).
function leerJson<T>(valor: unknown, validar: (v: unknown) => v is T): T[] | null {
  if (valor === null || valor === undefined) return null;
  if (!Array.isArray(valor)) return null;
  const items = valor.filter(validar);
  return items.length > 0 ? items : null;
}

export function esHito(v: unknown): v is Hito {
  if (!v || typeof v !== "object") return false;
  const h = v as Record<string, unknown>;
  return (
    typeof h.anio === "string" &&
    typeof h.titulo === "string" &&
    typeof h.texto === "string"
  );
}

export function esEstadistica(v: unknown): v is Estadistica {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  return typeof e.valor === "string" && typeof e.etiqueta === "string";
}

export function esFotoGaleria(v: unknown): v is FotoGaleria {
  if (!v || typeof v !== "object") return false;
  const f = v as Record<string, unknown>;
  return typeof f.url === "string";
}

export function leerHitos(valor: unknown): Hito[] | null {
  return leerJson<Hito>(valor, esHito);
}

export function leerEstadisticas(valor: unknown): Estadistica[] | null {
  return leerJson<Estadistica>(valor, esEstadistica);
}

export function leerGaleria(valor: unknown): FotoGaleria[] | null {
  return leerJson<FotoGaleria>(valor, esFotoGaleria);
}

/// Valida y normaliza el cuerpo de edición completo de "Sobre el centro".
/// Cada sección es opcional: un texto vacío o una lista vacía se guarda como
/// null y hace que esa sección no se muestre en la vista pública.
export function validarSobreElCentro(input: unknown): ResultadoSobreElCentro {
  const fuente = (input ?? {}) as Record<string, unknown>;

  function limpiar(campo: string, max: number): string | null {
    const valor = fuente[campo];
    if (valor === undefined || valor === null) return null;
    if (typeof valor !== "string") return null;
    const texto = valor.trim();
    if (!texto) return null;
    return texto.length > max ? texto.slice(0, max) : texto;
  }

  const intro = limpiar("intro", 1000);
  const misionTitulo = limpiar("misionTitulo", MAX_TITULO);
  const misionTexto = limpiar("misionTexto", MAX_TEXTO);
  const historiaTitulo = limpiar("historiaTitulo", MAX_TITULO);
  const historiaTexto = limpiar("historiaTexto", MAX_TEXTO);
  const estadisticasTitulo = limpiar("estadisticasTitulo", MAX_TITULO);
  const galeriaTitulo = limpiar("galeriaTitulo", MAX_TITULO);

  const hitos = validarHitos(fuente.hitos);
  if (!hitos.ok) return { ok: false, error: hitos.error };
  const estadisticas = validarEstadisticas(fuente.estadisticas);
  if (!estadisticas.ok) return { ok: false, error: estadisticas.error };
  const galeria = validarGaleria(fuente.galeria);
  if (!galeria.ok) return { ok: false, error: galeria.error };

  let activo: boolean | undefined;
  if (fuente.activo !== undefined && fuente.activo !== null) {
    if (typeof fuente.activo !== "boolean") {
      return { ok: false, error: "activo debe ser un valor booleano." };
    }
    activo = fuente.activo;
  }

  return {
    ok: true,
    datos: {
      intro,
      misionTitulo,
      misionTexto,
      historiaTitulo,
      historiaTexto,
      hitos: hitos.valor,
      estadisticasTitulo,
      estadisticas: estadisticas.valor,
      galeriaTitulo,
      galeria: galeria.valor,
      activo,
    },
  };
}

function validarHitos(valor: unknown): { ok: true; valor: Hito[] | null } | { ok: false; error: string } {
  if (valor === undefined || valor === null) return { ok: true, valor: null };
  if (!Array.isArray(valor)) {
    return { ok: false, error: "Los hitos deben ser una lista." };
  }
  if (valor.length > MAX_HITOS) {
    return { ok: false, error: `No podés cargar más de ${MAX_HITOS} hitos.` };
  }
  const hitos: Hito[] = [];
  for (const item of valor) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Cada hito debe tener año, título y texto." };
    }
    const h = item as Record<string, unknown>;
    const anio = String(h.anio ?? "").trim().slice(0, 20);
    const titulo = String(h.titulo ?? "").trim().slice(0, MAX_TITULO);
    const texto = String(h.texto ?? "").trim().slice(0, 2000);
    if (!titulo || !texto) {
      return { ok: false, error: "Cada hito debe tener título y texto." };
    }
    hitos.push({ anio, titulo, texto });
  }
  return { ok: true, valor: hitos.length > 0 ? hitos : null };
}

function validarEstadisticas(valor: unknown): { ok: true; valor: Estadistica[] | null } | { ok: false; error: string } {
  if (valor === undefined || valor === null) return { ok: true, valor: null };
  if (!Array.isArray(valor)) {
    return { ok: false, error: "Las estadísticas deben ser una lista." };
  }
  if (valor.length > MAX_ESTADISTICAS) {
    return { ok: false, error: `No podés cargar más de ${MAX_ESTADISTICAS} estadísticas.` };
  }
  const stats: Estadistica[] = [];
  for (const item of valor) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Cada estadística debe tener valor y etiqueta." };
    }
    const e = item as Record<string, unknown>;
    const valorTexto = String(e.valor ?? "").trim().slice(0, 100);
    const etiqueta = String(e.etiqueta ?? "").trim().slice(0, 200);
    if (!valorTexto || !etiqueta) {
      return { ok: false, error: "Cada estadística debe tener valor y etiqueta." };
    }
    stats.push({ valor: valorTexto, etiqueta });
  }
  return { ok: true, valor: stats.length > 0 ? stats : null };
}

function validarGaleria(valor: unknown): { ok: true; valor: FotoGaleria[] | null } | { ok: false; error: string } {
  if (valor === undefined || valor === null) return { ok: true, valor: null };
  if (!Array.isArray(valor)) {
    return { ok: false, error: "La galería debe ser una lista." };
  }
  if (valor.length > MAX_GALERIA) {
    return { ok: false, error: `No podés cargar más de ${MAX_GALERIA} fotos en la galería.` };
  }
  const galeria: FotoGaleria[] = [];
  for (const item of valor) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Cada foto de la galería debe tener una URL." };
    }
    const f = item as Record<string, unknown>;
    const imagen = validarImagenUrl(f.url);
    if (imagen.error || !imagen.valor || !/^\/api\/imagenes\/\d+$/.test(imagen.valor)) {
      return {
        ok: false,
        error: "Las fotos de la galería deben subirse desde el panel.",
      };
    }
    const leyenda = String(f.leyenda ?? "").trim().slice(0, 300);
    galeria.push({ url: imagen.valor, leyenda: leyenda || "" });
  }
  return { ok: true, valor: galeria.length > 0 ? galeria : null };
}