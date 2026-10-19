// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { prisma } from "@/lib/prisma";

export const TIPOS_NOTIFICACION = {
  CURSO_ASIGNADO: "curso_asignado",
} as const;

/// Avisa a uno o más docentes que quedaron asignados a un curso. Es de mejor
/// esfuerzo: si falla no debe tumbar el alta o la edición del curso (el curso
/// ya quedó guardado), así que el error se registra y se continúa.
export async function notificarCursoAsignado(
  docenteIds: number[],
  curso: { id: number; nombre: string }
): Promise<void> {
  const ids = [...new Set(docenteIds)].filter(
    (n) => Number.isInteger(n) && n > 0
  );
  if (ids.length === 0) return;

  try {
    await prisma.notificacion.createMany({
      data: ids.map((usuarioId) => ({
        usuarioId,
        tipo: TIPOS_NOTIFICACION.CURSO_ASIGNADO,
        mensaje: `Te asignaron al curso «${curso.nombre}».`,
        url: "/panel",
      })),
    });
  } catch (err) {
    console.error("[notificaciones] No se pudo crear el aviso:", err);
  }
}
