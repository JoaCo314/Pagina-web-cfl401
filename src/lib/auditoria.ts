// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { prisma } from "@/lib/prisma";
import type { UsuarioSesion } from "@/lib/auth/session";

/// Verbos que se registran en la auditoría. Son cortos y estables: se usan para
/// filtrar en el panel, así que renombrarlos cambia el historial guardado.
export const ACCIONES_AUDITORIA = {
  CREAR: "crear",
  EDITAR: "editar",
  ELIMINAR: "eliminar",
  ACTIVAR: "activar",
  DESACTIVAR: "desactivar",
  BLANQUEAR: "blanquear",
  ASIGNAR_DOCENTES: "asignar_docentes",
  MARCAR_LEIDA: "marcar_leida",
  BLOQUEAR: "bloquear",
} as const;

export const RECURSOS_AUDITORIA = {
  USUARIO: "usuario",
  CURSO: "curso",
  CATEGORIA_CURSO: "categoria_curso",
  NOTICIA: "noticia",
  PREGUNTA: "pregunta",
  CATEGORIA_PREGUNTA: "categoria_pregunta",
  GUIA: "guia",
  SOBRE_EL_CENTRO: "sobre_el_centro",
  SITE_CONFIG: "site_config",
  IMAGEN: "imagen",
  CONSULTA: "consulta",
} as const;

export type AccionAuditoria =
  (typeof ACCIONES_AUDITORIA)[keyof typeof ACCIONES_AUDITORIA];
export type RecursoAuditoria =
  (typeof RECURSOS_AUDITORIA)[keyof typeof RECURSOS_AUDITORIA];

export const ETIQUETAS_ACCION: Record<string, string> = {
  [ACCIONES_AUDITORIA.CREAR]: "Creó",
  [ACCIONES_AUDITORIA.EDITAR]: "Editó",
  [ACCIONES_AUDITORIA.ELIMINAR]: "Eliminó",
  [ACCIONES_AUDITORIA.ACTIVAR]: "Activó",
  [ACCIONES_AUDITORIA.DESACTIVAR]: "Desactivó",
  [ACCIONES_AUDITORIA.BLANQUEAR]: "Blanqueó la contraseña",
  [ACCIONES_AUDITORIA.ASIGNAR_DOCENTES]: "Asignó docentes",
  [ACCIONES_AUDITORIA.MARCAR_LEIDA]: "Marcó como leída",
  [ACCIONES_AUDITORIA.BLOQUEAR]: "Bloqueó la cuenta",
};

export const ETIQUETAS_RECURSO: Record<string, string> = {
  [RECURSOS_AUDITORIA.USUARIO]: "Usuarios",
  [RECURSOS_AUDITORIA.CURSO]: "Cursos",
  [RECURSOS_AUDITORIA.CATEGORIA_CURSO]: "Categorías de cursos",
  [RECURSOS_AUDITORIA.NOTICIA]: "Noticias",
  [RECURSOS_AUDITORIA.PREGUNTA]: "Preguntas frecuentes",
  [RECURSOS_AUDITORIA.CATEGORIA_PREGUNTA]: "Categorías de preguntas",
  [RECURSOS_AUDITORIA.GUIA]: "Guía de inscripción",
  [RECURSOS_AUDITORIA.SOBRE_EL_CENTRO]: "Sobre el centro",
  [RECURSOS_AUDITORIA.SITE_CONFIG]: "Configuración del sitio",
  [RECURSOS_AUDITORIA.IMAGEN]: "Imágenes",
  [RECURSOS_AUDITORIA.CONSULTA]: "Consultas",
};

/// Claves que nunca se guardan en el `detalle` aunque vengan en el payload.
const CLAVES_PROHIBIDAS = new Set([
  "password",
  "passwordhash",
  "contrasena",
  "contrasenatemporal",
  "dni",
  "token",
  "secreto",
]);

const LARGO_MAXIMO_VALOR = 120;

/// Valores escalares aptos para un campo Json de Prisma.
type ValorJson = string | number | boolean | null;

/// Reduce un objeto de cambios a algo apto para persistir en un Json: solo
/// valores escalares, sin datos sensibles y con textos largos truncados. Los
/// textos completos (contenidos de noticias, guías, etc.) no se registran.
export function resumirCambios(
  cambios: Record<string, unknown> | null | undefined
): Record<string, ValorJson> | null {
  if (!cambios) return null;
  const salida: Record<string, ValorJson> = {};
  for (const [clave, valor] of Object.entries(cambios)) {
    if (CLAVES_PROHIBIDAS.has(clave.toLowerCase().replace(/[_\s]/g, ""))) {
      continue;
    }
    if (valor === null || valor === undefined) {
      salida[clave] = null;
      continue;
    }
    if (typeof valor === "string") {
      salida[clave] =
        valor.length > LARGO_MAXIMO_VALOR
          ? `${valor.slice(0, LARGO_MAXIMO_VALOR)}…`
          : valor;
      continue;
    }
    if (typeof valor === "number" || typeof valor === "boolean") {
      salida[clave] = valor;
      continue;
    }
    // Arrays de escalares se resumen como lista; el resto (objetos, arrays
    // anidados) no se persiste completo.
    if (
      Array.isArray(valor) &&
      valor.every(
        (v) =>
          v === null ||
          typeof v === "string" ||
          typeof v === "number" ||
          typeof v === "boolean"
      )
    ) {
      const unido = valor.join(", ");
      salida[clave] =
        unido.length > LARGO_MAXIMO_VALOR
          ? `${unido.slice(0, LARGO_MAXIMO_VALOR)}…`
          : unido;
      continue;
    }
    // Fechas, objetos y arrays anidados no se persisten completos.
    salida[clave] = valor instanceof Date ? valor.toISOString() : "(…)";
  }
  return Object.keys(salida).length > 0 ? salida : null;
}

export type EntradaAuditoria = {
  /// Usuario que ejecuta la acción. Si es null (p. ej. un proceso interno) la
  /// fila queda sin datos de cuenta.
  usuario?: UsuarioSesion | null;
  accion: AccionAuditoria | string;
  recurso: RecursoAuditoria | string;
  recursoId?: number | null;
  /// Texto legible del recurso afectado, p. ej. `Curso «Electricidad»`.
  resumen?: string | null;
  /// Campos afectados con sus valores nuevos (ya saneados por `resumirCambios`).
  detalle?: Record<string, unknown> | null;
  ip?: string | null;
};

/// Registra una acción administrativa. Es best-effort y nunca lanza: un fallo al
/// auditar no debe impedir que la operación principal se complete.
export async function registrarAuditoria(
  entrada: EntradaAuditoria
): Promise<void> {
  try {
    await prisma.auditoriaAccion.create({
      data: {
        usuarioId: entrada.usuario?.id ?? null,
        usuarioEmail: entrada.usuario?.email ?? null,
        usuarioNombre: entrada.usuario
          ? `${entrada.usuario.nombre} ${entrada.usuario.apellido}`.trim()
          : null,
        rol: entrada.usuario?.rol?.nombre ?? null,
        accion: entrada.accion,
        recurso: entrada.recurso,
        recursoId: entrada.recursoId ?? null,
        resumen: entrada.resumen ?? null,
        detalle: resumirCambios(entrada.detalle) ?? undefined,
        ip: entrada.ip ?? null,
      },
    });
  } catch (err) {
    console.error("[auditoria] No se pudo registrar la acción:", err);
  }
}
