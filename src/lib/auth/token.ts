import { SignJWT, jwtVerify } from "jose";

/// Emisión y verificación del JWT de sesión. Vive en su propio módulo (sin
/// Prisma ni `next/headers`) para poder importarse desde el `middleware.ts`,
/// que corre en el runtime Edge. `session.ts` reexporta estas funciones para el
/// resto de la aplicación.
export const SESSION_COOKIE = "cfl401_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function obtenerSecreto(): Uint8Array {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) {
    throw new Error("Falta la variable AUTH_SECRET para firmar las sesiones.");
  }
  // El secreto se usa para firmar JWT con HS256: si es corto, se puede forzar
  // por fuerza bruta y falsificar sesiones de admin. 32+ caracteres (al menos
  // 256 bits) es la longitud mínima razonable para HMAC.
  if (secreto.length < 32) {
    throw new Error(
      "AUTH_SECRET es demasiado corta: usá al menos 32 caracteres " +
        "(generala con `openssl rand -hex 32`)."
    );
  }
  return new TextEncoder().encode(secreto);
}

export async function crearTokenSesion(
  userId: number,
  versionSesion: number
): Promise<string> {
  return new SignJWT({ ver: versionSesion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(obtenerSecreto());
}

export async function verificarTokenSesion(
  token: string
): Promise<{ userId: number; version: number } | null> {
  try {
    const { payload } = await jwtVerify(token, obtenerSecreto());
    if (!payload.sub) return null;
    const version = Number(payload.ver);
    return {
      userId: Number(payload.sub),
      // Tokens emitidos antes de existir `ver` (o con un claim inválido) se
      // tratan como versión 1: siguen funcionando hasta el próximo cambio de
      // contraseña, que los invalida igual.
      version: Number.isInteger(version) && version > 0 ? version : 1,
    };
  } catch {
    return null;
  }
}
