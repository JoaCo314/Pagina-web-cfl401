import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { puedeGestionarUsuario } from "@/lib/auth/autorizacion";
import {
  contrasenaTemporalDesdeDni,
  hashPassword,
} from "@/lib/auth/password";
import { USUARIO_SELECT } from "@/lib/usuariosAdmin";

export const dynamic = "force-dynamic";

const REGEX_DNI = /^\d{7,8}$/;

/// Edición básica de usuario (RF-15): desactivar o reactivar una cuenta,
/// corregir su DNI y blanquear su contraseña. El Administrador puede hacerlo
/// sobre cualquier cuenta; el Preceptor solo sobre cuentas con rol Docente. La
/// desactivación impide iniciar sesión y revoca las sesiones activas
/// (getCurrentUser filtra por `activo`).
///
/// El blanqueo nunca recibe una contraseña escrita por el administrador: la
/// contraseña temporal siempre se deriva del DNI (últimos 4 dígitos) y la
/// cuenta queda marcada para que el usuario la cambie al próximo ingreso.
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

  const existente = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      rol: { select: { nombre: true } },
    },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "El usuario no existe." },
      { status: 404 }
    );
  }

  if (!puedeGestionarUsuario(user, existente)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
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

  if (fuente.password !== undefined) {
    return NextResponse.json(
      {
        error:
          "No se puede asignar una contraseña escrita a mano. Usá la acción para blanquear la contraseña.",
      },
      { status: 400 }
    );
  }

  if (fuente.accion !== undefined && fuente.accion !== "blanquearContrasena") {
    return NextResponse.json(
      { error: "Acción desconocida." },
      { status: 400 }
    );
  }

  if (fuente.accion === "blanquearContrasena") {
    const contrasenaTemporal = contrasenaTemporalDesdeDni(existente.dni);
    try {
      const usuario = await prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          passwordHash: hashPassword(contrasenaTemporal),
          debeCambiarContrasena: true,
        },
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

  if (fuente.dni !== undefined) {
    if (typeof fuente.dni !== "string" || !REGEX_DNI.test(fuente.dni.trim())) {
      return NextResponse.json(
        { error: "El DNI debe tener 7 u 8 dígitos." },
        { status: 400 }
      );
    }
    const dni = fuente.dni.trim();
    if (dni !== existente.dni) {
      const dniEnUso = await prisma.usuario.findUnique({
        where: { dni },
        select: { id: true },
      });
      if (dniEnUso) {
        return NextResponse.json(
          { error: "Ya existe un usuario con ese DNI." },
          { status: 409 }
        );
      }
      cambios.dni = dni;
    }
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
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese DNI." },
        { status: 409 }
      );
    }
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}