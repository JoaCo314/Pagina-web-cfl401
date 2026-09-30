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
  debeCambiarContrasena: true,
  rol: { select: { nombre: true, nivel: true } },
} as const;

/// Control básico de intentos fallidos (anti fuerza bruta). Hay dos contadores
/// independientes: por cuenta (email) y por IP de origen (anti password
/// spraying). Estado en memoria del proceso: suficiente para el despliegue de
/// una sola instancia; al reiniciar se reinicia el contador.
const MAX_INTENTOS_FALLIDOS = 5;
const MAX_INTENTOS_POR_IP = 20;
const BLOQUEO_MS = 15 * 60 * 1000;
const intentosPorEmail = new Map<
  string,
  { fallidos: number; bloqueadoHasta: number | null }
>();
const intentosPorIp = new Map<
  string,
  { fallidos: number; bloqueadoHasta: number | null }
>();

type RegistroIntentos = { fallidos: number; bloqueadoHasta: number | null };

function leerRegistro(
  map: Map<string, RegistroIntentos>,
  clave: string
): RegistroIntentos {
  const reg = map.get(clave);
  if (!reg) return { fallidos: 0, bloqueadoHasta: null };
  if (reg.bloqueadoHasta && Date.now() >= reg.bloqueadoHasta) {
    map.delete(clave);
    return { fallidos: 0, bloqueadoHasta: null };
  }
  return reg;
}

function estaBloqueado(reg: RegistroIntentos): boolean {
  return reg.bloqueadoHasta !== null && Date.now() < reg.bloqueadoHasta;
}

function registrarFallo(
  map: Map<string, RegistroIntentos>,
  clave: string,
  max: number
): void {
  const actual = leerRegistro(map, clave);
  const fallidos = actual.fallidos + 1;
  map.set(clave, {
    fallidos: fallidos >= max ? 0 : fallidos,
    bloqueadoHasta: fallidos >= max ? Date.now() + BLOQUEO_MS : null,
  });
}

function ipCliente(request: NextRequest): string {
  const forward = request.headers.get("x-forwarded-for");
  if (forward) return forward.split(",")[0]?.trim() || "sin-proxy";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim() || "sin-proxy";
  return "sin-proxy";
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

  const ip = ipCliente(request);
  const registroEmail = leerRegistro(intentosPorEmail, email.toLowerCase());
  const registroIp = leerRegistro(intentosPorIp, ip);
  if (estaBloqueado(registroEmail) || estaBloqueado(registroIp)) {
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
    registrarFallo(intentosPorEmail, email.toLowerCase(), MAX_INTENTOS_FALLIDOS);
    registrarFallo(intentosPorIp, ip, MAX_INTENTOS_POR_IP);
    return NextResponse.json(
      { error: "Credenciales inválidas. Verificá los datos ingresados." },
      { status: 401 }
    );
  }

  intentosPorEmail.delete(email.toLowerCase());
  intentosPorIp.delete(ip);

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