/// Claves de los 4 bloques de contenido de la guía de inscripción (RF-05).
/// Deben coincidir con las que siembra prisma/seed.ts.
export const CLAVES_CONTENIDO_GUIA = [
  "pasos",
  "documentacion",
  "requisitos",
  "informacion_adicional",
] as const;

export type ClaveContenidoGuia = (typeof CLAVES_CONTENIDO_GUIA)[number];

export type ContenidoGuiaInput = {
  clave: ClaveContenidoGuia;
  titulo: string;
  contenido: string;
};

export type ResultadoContenidosGuia =
  | { ok: true; contenidos: ContenidoGuiaInput[] }
  | { ok: false; error: string };

/// Valida y normaliza el cuerpo de edición de la guía: una lista de bloques
/// (clave + titulo + contenido) a persistir. Solo acepta las claves de los 4
/// bloques definidos, sin duplicados, y con titulo/contenido no vacíos.
export function validarContenidosGuia(
  input: unknown
): ResultadoContenidosGuia {
  const fuente = (input ?? {}) as Record<string, unknown>;

  if (!Array.isArray(fuente.contenidos) || fuente.contenidos.length === 0) {
    return {
      ok: false,
      error: "Debe enviarse al menos un bloque de contenido.",
    };
  }

  const claves = new Set<string>();
  const contenidos: ContenidoGuiaInput[] = [];

  for (const item of fuente.contenidos) {
    const bloque = (item ?? {}) as Record<string, unknown>;

    if (typeof bloque.clave !== "string" || !bloque.clave.trim()) {
      return { ok: false, error: "Cada bloque debe incluir su clave." };
    }
    const clave = bloque.clave.trim() as ClaveContenidoGuia;
    if (!(CLAVES_CONTENIDO_GUIA as readonly string[]).includes(clave)) {
      return {
        ok: false,
        error: `La clave de contenido "${clave}" no es válida.`,
      };
    }
    if (claves.has(clave)) {
      return {
        ok: false,
        error: `La clave de contenido "${clave}" está duplicada.`,
      };
    }
    claves.add(clave);

    if (typeof bloque.titulo !== "string" || !bloque.titulo.trim()) {
      return { ok: false, error: "El título del contenido es obligatorio." };
    }
    const titulo = bloque.titulo.trim();
    if (titulo.length > 200) {
      return {
        ok: false,
        error: "El título no puede superar 200 caracteres.",
      };
    }

    if (typeof bloque.contenido !== "string" || !bloque.contenido.trim()) {
      return { ok: false, error: "El contenido es obligatorio." };
    }
    const contenido = bloque.contenido.trim();
    if (contenido.length > 10000) {
      return {
        ok: false,
        error: "El contenido no puede superar 10000 caracteres.",
      };
    }

    contenidos.push({ clave, titulo, contenido });
  }

  return { ok: true, contenidos };
}