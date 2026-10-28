import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { respuestaSiContrasenaTemporal } from "@/lib/auth/guardias";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { ipCliente } from "@/lib/auth/rateLimit";
import {
  ACCIONES_AUDITORIA,
  RECURSOS_AUDITORIA,
  registrarAuditoria,
} from "@/lib/auditoria";

export const dynamic = "force-dynamic";

/// Reordenar preguntas frecuentes dentro de una categoría.
/// Payload esperado: { categoriaId: number, ordenIds: number[] }
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const bloqueado = respuestaSiContrasenaTemporal(user);
  if (bloqueado) return bloqueado;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida: se esperaba un JSON." },
      { status: 400 }
    );
  }

  const { categoriaId, ordenIds } = (body ?? {}) as {
    categoriaId?: unknown;
    ordenIds?: unknown;
  };

  if (typeof categoriaId !== "number" || !Array.isArray(ordenIds)) {
    return NextResponse.json(
      { error: "Datos de reordenamiento inválidos." },
      { status: 400 }
    );
  }

  for (const id of ordenIds) {
    if (typeof id !== "number" || !Number.isInteger(id)) {
      return NextResponse.json(
        { error: "Los identificadores deben ser enteros válidos." },
        { status: 400 }
      );
    }
  }

  try {
    // Validar que todas las preguntas pertenezcan a la categoría indicada
    const preguntas = await prisma.preguntaFrecuente.findMany({
      where: {
        categoriaId,
        id: { in: ordenIds },
      },
      select: { id: true },
    });

    if (preguntas.length !== ordenIds.length) {
      return NextResponse.json(
        { error: "Una o más preguntas no corresponden a la categoría indicada." },
        { status: 400 }
      );
    }

    // Actualizar el orden en una transacción
    await prisma.$transaction(
      ordenIds.map((id, index) =>
        prisma.preguntaFrecuente.update({
          where: { id },
          data: { orden: index + 1 },
        })
      )
    );

    await registrarAuditoria({
      usuario: user,
      accion: ACCIONES_AUDITORIA.EDITAR,
      recurso: RECURSOS_AUDITORIA.CATEGORIA_PREGUNTA,
      recursoId: categoriaId,
      resumen: `Reordenó preguntas de la categoría #${categoriaId}`,
      detalle: {
        accion: "reordenar_preguntas",
        categoriaId,
        cantidad: ordenIds.length,
      },
      ip: ipCliente(request),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] Error al reordenar preguntas:", err);
    return NextResponse.json(
      { error: "No se pudo actualizar el orden de las preguntas." },
      { status: 500 }
    );
  }
}
