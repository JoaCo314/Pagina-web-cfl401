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

export const dynamic = "force-dynamic";

const USUARIO_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  passwordHash: true,
  activo: true,
  debeCambiarContrasena: true,
  versionSesion: true,
  rol: { select: { nombre: true, nivel: true } },
} as const;

/// Control de intentos fallidos (anti fuerza bruta). Dos contadores
/// independientes: por cuenta (email) y por IP de origen (anti password
/// spraying). Ver `src/lib/auth/rateLimit.ts` para el alcance del estado en
/// memoria.
const limitador = crearLimitador({
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

  const usuario = await prisma.usuario.findUnique({
    where: { email: identidad },
    select: USUARIO_SELECT,
  });

  // bcrypt se ejecuta siempre, contra el hash real o el dummy, antes de decidir.
  // Si se cortocircuitara antes de comparar, un atacante mediría cuándo falta la
  // cuenta por la diferencia de tiempo y así enumeraría los emails existentes.
  const hashAContrastar = usuario?.activo ? usuario.passwordHash : HASH_DUMMY;
  const contrasenaCorrecta = verificarPassword(password, hashAContrastar);
  const credencialesValidas =
    usuario !== null && usuario.activo && contrasenaCorrecta;

  if (!usuario || !credencialesValidas) {
    limitador.registrarFallo(identidad, ip);
    return NextResponse.json(
      { error: "Credenciales inválidas. Verificá los datos ingresados." },
      { status: 401 }
    );
  }

  limitador.limpiar(identidad, ip);

  const token = await crearTokenSesion(usuario.id, usuario.versionSesion);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, opcionesCookieSesion(request));

  return NextResponse.json({ user: publicarUsuario(usuario) });
}