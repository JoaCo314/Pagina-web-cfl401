import { NextRequest, NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { USUARIO_SELECT } from "@/lib/usuariosAdmin";

export const dynamic = "force-dynamic";

/// Edición básica de usuario (RF-15): desactivar o reactivar una cuenta y
/// resetear la contraseña desde el panel. Exclusivo de Administrador. La
/// desactivación impide iniciar sesión y revoca las sesiones activas
/// (getCurrentUser filtra por `activo`).
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
  const cambios: Record<string, unknown> = {};

  if (fuente.activo !== undefined) {
    if (typeof fuente.activo !== "boolean") {
      return NextResponse.json(
        { error: "El campo activo debe ser un valor booleano." },
        { status: 400 }
      );
    }
    if (usuarioId === user.id) {
      return NextResponse.json(
        { error: "No podés desactivar tu propia cuenta." },
        { status: 400 }
      );
    }
    cambios.activo = fuente.activo;
  }

  if (fuente.password !== undefined) {
    if (typeof fuente.password !== "string" || !fuente.password.trim()) {
      return NextResponse.json(
        { error: "La contraseña no puede estar vacía." },
        { status: 400 }
      );
    }
    if (fuente.password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }
    cambios.passwordHash = hashSync(fuente.password, 10);
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json(
      { error: "No se enviaron campos para actualizar." },
      { status: 400 }
    );
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: cambios,
      select: USUARIO_SELECT,
    });

    return NextResponse.json({ usuario });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}