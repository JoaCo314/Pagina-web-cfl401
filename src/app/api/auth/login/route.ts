import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  crearTokenSesion,
  publicarUsuario,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const USUARIO_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  passwordHash: true,
  activo: true,
  rol: { select: { nombre: true, nivel: true } },
} as const;

/// Control básico de intentos fallidos por cuenta (anti fuerza bruta).
/// Estado en memoria del proceso: suficiente para el despliegue de una sola
/// instancia; al reiniciar se reinicia el contador.
const MAX_INTENTOS_FALLIDOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const intentosPorEmail = new Map<
  string,
  { fallidos: number; bloqueadoHasta: number | null }
>();

function estadoIntentos(email: string): {
  fallidos: number;
  bloqueadoHasta: number | null;
} {
  const clave = email.toLowerCase();
  const registro = intentosPorEmail.get(clave);
  if (!registro) return { fallidos: 0, bloqueadoHasta: null };
  if (registro.bloqueadoHasta && Date.now() >= registro.bloqueadoHasta) {
    intentosPorEmail.delete(clave);
    return { fallidos: 0, bloqueadoHasta: null };
  }
  return registro;
}

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

  const estado = estadoIntentos(email);
  if (estado.bloqueadoHasta && Date.now() < estado.bloqueadoHasta) {
    return NextResponse.json(
      { error: "Demasiados intentos fallidos. Probá de nuevo más tarde." },
      { status: 429 }
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: USUARIO_SELECT,
  });

  const credencialesValidas =
    usuario !== null &&
    usuario.activo &&
    verificarPassword(password, usuario.passwordHash);

  if (!usuario || !credencialesValidas) {
    const clave = email.toLowerCase();
    const actual = estadoIntentos(email);
    const fallidos = actual.fallidos + 1;
    if (fallidos >= MAX_INTENTOS_FALLIDOS) {
      intentosPorEmail.set(clave, {
        fallidos: 0,
        bloqueadoHasta: Date.now() + BLOQUEO_MS,
      });
    } else {
      intentosPorEmail.set(clave, { fallidos, bloqueadoHasta: null });
    }
    return NextResponse.json(
      { error: "Credenciales inválidas. Verificá los datos ingresados." },
      { status: 401 }
    );
  }

  intentosPorEmail.delete(email.toLowerCase());

  const token = await crearTokenSesion(usuario.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ user: publicarUsuario(usuario) });
}