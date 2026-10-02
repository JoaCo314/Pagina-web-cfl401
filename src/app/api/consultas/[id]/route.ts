import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { respuestaSiContrasenaTemporal } from "@/lib/auth/guardias";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";

export const dynamic = "force-dynamic";

/// Marca una consulta como leída (o la vuelve a marcar como no leída).
/// Exclusivo del Administrador, igual que el listado.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const mensajeId = Number(id);
  if (!Number.isInteger(mensajeId) || mensajeId <= 0) {
    return NextResponse.json(
      { error: "ID de consulta inválido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.CONSULTAS_VER)) {
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

  const fuente = (body ?? {}) as Record<string, unknown>;
  if (typeof fuente.leido !== "boolean") {
    return NextResponse.json(
      { error: "El campo leido debe ser un valor booleano." },
      { status: 400 }
    );
  }

  const existente = await prisma.mensajeContacto.findUnique({
    where: { id: mensajeId },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "La consulta no existe." },
      { status: 404 }
    );
  }

  try {
    const mensaje = await prisma.mensajeContacto.update({
      where: { id: mensajeId },
      data: { leido: fuente.leido },
      select: { id: true, leido: true },
    });

    return NextResponse.json({ mensaje });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}