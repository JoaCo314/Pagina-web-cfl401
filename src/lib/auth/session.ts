import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "cfl401_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type UsuarioSesion = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: { nombre: string; nivel: number };
};

function obtenerSecreto(): Uint8Array {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) {
    throw new Error("Falta la variable AUTH_SECRET para firmar las sesiones.");
  }
  return new TextEncoder().encode(secreto);
}

export async function crearTokenSesion(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(obtenerSecreto());
}

export async function verificarTokenSesion(
  token: string
): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, obtenerSecreto());
    return payload.sub ? Number(payload.sub) : null;
  } catch {
    return null;
  }
}

function seleccionUsuario() {
  return {
    id: true,
    nombre: true,
    apellido: true,
    email: true,
    activo: true,
    rol: { select: { nombre: true, nivel: true } },
  } as const;
}

export function publicarUsuario(
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    activo: boolean;
    rol: { nombre: string; nivel: number };
  }
): UsuarioSesion {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol: usuario.rol,
  };
}

export async function getCurrentUser(): Promise<UsuarioSesion | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = await verificarTokenSesion(token);
  if (!userId) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: seleccionUsuario(),
  });
  if (!usuario || !usuario.activo) return null;

  return publicarUsuario(usuario);
}