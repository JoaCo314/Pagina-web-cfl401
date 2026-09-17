import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { USUARIO_SELECT } from "@/lib/usuariosAdmin";

export const dynamic = "force-dynamic";

/// Edición básica de usuario (RF-15): desactivar o reactivar una cuenta.
/// Exclusivo de Administrador. La desactivación impide iniciar sesión y
/// revoca las sesiones activas (getCurrentUser filtra por `activo`).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const usuarioId = Number(id);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return NextResponse.json(
      { error: "ID de usuario inválido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.USUARIOS_VER_TODOS)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const existente = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nombre: true, apellido: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "El usuario no existe." },
      { status: 404 }
    );
  }

  if (usuarioId === user.id) {
    return NextResponse.json(
      { error: "No podés desactivar tu propia cuenta." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida: se esperaba un JSON." },
      { status: 400 }
    );
  }

  const { activo } = (body ?? {}) as Record<string, unknown>;
  if (typeof activo !== "boolean") {
    return NextResponse.json(
      { error: "El campo activo debe ser un valor booleano." },
      { status: 400 }
    );
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { activo },
      select: USUARIO_SELECT,
    });

    return NextResponse.json({ usuario });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}