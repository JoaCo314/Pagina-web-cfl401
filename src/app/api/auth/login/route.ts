// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarPassword } from "@/lib/auth/password";
import { crearLimitador, ipCliente } from "@/lib/auth/rateLimit";
import {
  SESSION_COOKIE,
  crearTokenSesion,
  opcionesCookieSesion,
  publicarUsuario,
} from "@/lib/auth/session";
import {
  ACCIONES_AUDITORIA,
  RECURSOS_AUDITORIA,
  registrarAuditoria,
} from "@/lib/auditoria";

export const dynamic = "force-dynamic";

const USUARIO_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  passwordHash: true,
  activo: true,
  bloqueada: true,
  debeCambiarContrasena: true,
  versionSesion: true,
  rol: { select: { nombre: true, nivel: true } },
} as const;

/// Control de intentos fallidos (anti fuerza bruta). Dos contadores
/// independientes: por cuenta (email) y por IP de origen (anti password
/// spraying). El estado se guarda en la base (ver `src/lib/auth/rateLimit.ts`).
/// Al quinto fallo de una cuenta (maxIntentos) además se bloquea la cuenta de
/// forma permanente hasta que un Administrador o Preceptor la reactive.
const limitador = crearLimitador({
  nombre: "login",
  maxIntentos: 5,
  maxIntentosPorIp: 20,
  duracionMs: 15 * 60 * 1000,
});

/// Hash de una contraseña inventada, con el mismo coste que las reales. Se usa
/// cuando el email no existe (o la cuenta está desactivada): bcrypt corre igual
/// contra este hash, así el tiempo de respuesta no delata si la cuenta existe.
const HASH_DUMMY =
  "$2b$10$awpPVJH0BlLhj8mYSThRC.1v16tHmykk4kir6sUKmVHPqbxruqs2y";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 }
    );
  }

  const { email, password } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return NextResponse.json(
      { error: "Ingresá tu correo electrónico y tu contraseña." },
      { status: 400 }
    );
  }

  const ip = ipCliente(request);
  const identidad = email.trim().toLowerCase();
  const limite = await limitador.chequear(identidad, ip);
  if (!limite.permitido) {
    return NextResponse.json(
      {
        error: "Demasiados intentos fallidos. Probá de nuevo más tarde.",
        esperaSegundos: limite.esperaSegundos,
      },
      { status: 429 }
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: identidad },
    select: USUARIO_SELECT,
  });

  // Cuenta bloqueada por intentos fallidos previos: se corta antes de comparar
  // la contraseña con un mensaje claro, para que quien la conoce sepa que el
  // problema no son sus credenciales sino el bloqueo (que revierte el panel).
  if (usuario?.bloqueada) {
    return NextResponse.json(
      {
        error:
          "Tu cuenta quedó bloqueada por demasiados intentos fallidos de inicio de sesión. Para recuperar el acceso, un administrador o preceptor tiene que reactivarla desde el panel.",
      },
      { status: 403 }
    );
  }

  // bcrypt se ejecuta siempre, contra el hash real o el dummy, antes de decidir.
  // Si se cortocircuitara antes de comparar, un atacante mediría cuándo falta la
  // cuenta por la diferencia de tiempo y así enumeraría los emails existentes.
  const hashAContrastar = usuario?.activo ? usuario.passwordHash : HASH_DUMMY;
  const contrasenaCorrecta = verificarPassword(password, hashAContrastar);
  const credencialesValidas =
    usuario !== null && usuario.activo && contrasenaCorrecta;

  if (!usuario || !credencialesValidas) {
    const { bloqueoCuenta } = await limitador.registrarFallo(identidad, ip);

    // Al agotar los intentos de una cuenta existente, además del bloqueo
    // temporal del limitador se bloquea la cuenta de forma permanente: queda
    // inactiva y solo un Administrador o Preceptor puede reactivarla desde el
    // panel (RF-15 y la política antifuerza bruta).
    if (bloqueoCuenta && usuario) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          bloqueada: true,
          bloqueadaEn: new Date(),
          activo: false,
          // Invalida cualquier sesión abierta de esa cuenta.
          versionSesion: { increment: 1 },
        },
      });

      await registrarAuditoria({
        usuario: null,
        accion: ACCIONES_AUDITORIA.BLOQUEAR,
        recurso: RECURSOS_AUDITORIA.USUARIO,
        recursoId: usuario.id,
        resumen: `Usuario «${usuario.nombre} ${usuario.apellido}»`,
        detalle: {
          motivo: "intentos fallidos de inicio de sesión",
          email: usuario.email,
        },
        ip,
      });

      return NextResponse.json(
        {
          error:
            "La cuenta quedó bloqueada tras demasiados intentos fallidos. Un administrador o preceptor puede reactivarla desde el panel.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Credenciales inválidas. Verificá los datos ingresados." },
      { status: 401 }
    );
  }

  await limitador.limpiar(identidad, ip);

  const token = await crearTokenSesion(usuario.id, usuario.versionSesion);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, opcionesCookieSesion(request));

  return NextResponse.json({ user: publicarUsuario(usuario) });
}