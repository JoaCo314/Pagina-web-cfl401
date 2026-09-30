import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  hashPassword,
  verificarPassword,
} from "@/lib/auth/password";

export const dynamic = "force-dynamic";

/// Cambio de contraseña de la cuenta propia. Es el cierre del flujo de blanqueo:
/// el usuario entra con la contraseña temporal (últimos 4 dígitos de su DNI) y
/// acá define una nueva. Solo se modifica la cuenta de la sesión en curso.
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
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
  const { passwordActual, passwordNueva } = fuente;

  if (typeof passwordActual !== "string" || !passwordActual) {
    return NextResponse.json(
      { error: "Ingresá tu contraseña actual." },
      { status: 400 }
    );
  }
  if (typeof passwordNueva !== "string" || !passwordNueva) {
    return NextResponse.json(
      { error: "Ingresá la contraseña nueva." },
      { status: 400 }
    );
  }
  if (passwordNueva.length < 8) {
    return NextResponse.json(
      { error: "La contraseña nueva debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }
  if (passwordNueva === passwordActual) {
    return NextResponse.json(
      { error: "La contraseña nueva debe ser distinta de la actual." },
      { status: 400 }
    );
  }

  const cuenta = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });
  if (!cuenta) {
    return NextResponse.json(
      { error: "La cuenta no existe." },
      { status: 404 }
    );
  }

  if (!verificarPassword(passwordActual, cuenta.passwordHash)) {
    return NextResponse.json(
      { error: "La contraseña actual no es correcta." },
      { status: 400 }
    );
  }

  try {
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(passwordNueva),
        debeCambiarContrasena: false,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}