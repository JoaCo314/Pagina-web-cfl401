import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  crearTokenSesion,
  getCurrentUser,
  opcionesCookieSesion,
} from "@/lib/auth/session";
import { crearLimitador, ipCliente } from "@/lib/auth/rateLimit";
import {
  contrasenaTemporalDesdeDni,
  hashPassword,
  verificarPassword,
} from "@/lib/auth/password";

export const dynamic = "force-dynamic";

/// Frena el intento de adivinar la contraseña actual desde una sesión válida:
/// sin este límite, un token robado o un equipo sin bloquear podrían iterar
/// contra la contraseña temporal.
const limitador = crearLimitador({
  maxIntentos: 5,
  maxIntentosPorIp: 20,
  duracionMs: 15 * 60 * 1000,
});

/// Cambio de contraseña de la cuenta propia. Es el cierre del flujo de blanqueo:
/// el usuario entra con la contraseña temporal (últimos 4 dígitos de su DNI) y
/// acá define una nueva. Solo se modifica la cuenta de la sesión en curso.
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const ip = ipCliente(request);
  const identidad = `usuario:${user.id}`;
  const limite = limitador.chequear(identidad, ip);
  if (!limite.permitido) {
    return NextResponse.json(
      {
        error: "Demasiados intentos fallidos. Probá de nuevo más tarde.",
        esperaSegundos: limite.esperaSegundos,
      },
      { status: 429 }
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
    select: {
      id: true,
      dni: true,
      passwordHash: true,
      debeCambiarContrasena: true,
      versionSesion: true,
    },
  });
  if (!cuenta) {
    return NextResponse.json(
      { error: "La cuenta no existe." },
      { status: 404 }
    );
  }

  if (passwordNueva === contrasenaTemporalDesdeDni(cuenta.dni)) {
    return NextResponse.json(
      {
        error:
          "La contraseña nueva no puede ser la contraseña temporal (los últimos 4 dígitos de tu DNI).",
      },
      { status: 400 }
    );
  }

  if (!verificarPassword(passwordActual, cuenta.passwordHash)) {
    limitador.registrarFallo(identidad, ip);
    return NextResponse.json(
      { error: "La contraseña actual no es correcta." },
      { status: 400 }
    );
  }

  try {
    // Incrementar la versión deja obsoletas las sesiones abiertas de esta
    // cuenta en otros navegadores o equipos.
    const actualizado = await prisma.usuario.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(passwordNueva),
        debeCambiarContrasena: false,
        versionSesion: { increment: 1 },
      },
      select: { versionSesion: true },
    });

    limitador.limpiar(identidad, ip);

    // La sesión en curso se renueva con la versión nueva para que el usuario
    // pueda seguir trabajando sin volver a entrar.
    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_COOKIE,
      await crearTokenSesion(user.id, actualizado.versionSesion),
      opcionesCookieSesion(request)
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}