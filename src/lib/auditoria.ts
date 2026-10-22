// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { prisma } from "@/lib/prisma";
import type { UsuarioSesion } from "@/lib/auth/session";
import type { AccionAuditoria, RecursoAuditoria } from "./auditoriaDatos";

// Constantes y etiquetas de la auditoría. Viven en un módulo sin dependencias
// de servidor para que el panel (componente cliente) también pueda usarlas.
export * from "./auditoriaDatos";

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
