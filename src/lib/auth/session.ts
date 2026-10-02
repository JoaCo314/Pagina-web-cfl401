import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "cfl401_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type UsuarioSesion = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  debeCambiarContrasena: boolean;
  rol: { nombre: string; nivel: number };
};

function obtenerSecreto(): Uint8Array {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) {
    throw new Error("Falta la variable AUTH_SECRET para firmar las sesiones.");
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

function seleccionUsuario() {
  return {
    id: true,
    nombre: true,
    apellido: true,
    email: true,
    activo: true,
    debeCambiarContrasena: true,
    versionSesion: true,
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
    debeCambiarContrasena: boolean;
    rol: { nombre: string; nivel: number };
  }
): UsuarioSesion {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    debeCambiarContrasena: usuario.debeCambiarContrasena,
    rol: usuario.rol,
  };
}

export async function getCurrentUser(): Promise<UsuarioSesion | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sesion = await verificarTokenSesion(token);
  if (!sesion) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion.userId },
    select: seleccionUsuario(),
  });
  if (!usuario || !usuario.activo) return null;

  // La versión de sesión viaja en el JWT y se compara con la de la base. Al
  // blanquear o cambiar una contraseña se incrementa en la base: todos los
  // tokens ya emitidos dejan de validar y hay que volver a entrar.
  if (usuario.versionSesion !== sesion.version) return null;

  return publicarUsuario(usuario);
}

/// Opciones de la cookie de sesión, en un solo lugar para que el login y el
/// cambio de contraseña no se desincronicen.
///
/// `sameSite: "lax"` es la defensa contra CSRF: la cookie no viaja en pedidos
/// originados desde otro sitio, así que un formulario malicioso en un dominio
/// ajeno no puede usar la sesión de la víctima. Combinado con que todos los
/// endpoints que modifican datos son POST/PUT/PATCH/DELETE (nunca GET), alcanza
/// sin token CSRF.
///
/// `secure` depende del protocolo real, no del que ve el contenedor: detrás de
/// un proxy que termina TLS, `request.nextUrl` llega como `http` y una cookie
/// sin `secure` viaja en claro.
export function opcionesCookieSesion(request: {
  nextUrl: { protocol: string };
  headers: { get(name: string): string | null };
}) {
  const protocolo =
    process.env.TRUST_PROXY === "true"
      ? (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol)
      : request.nextUrl.protocol;
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: protocolo.split(",")[0]?.trim() === "https:",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/// Cortocircuito de servidor para las páginas del panel: mientras la contraseña
/// sea temporal (cuenta blanqueada o recién creada) no se puede operar nada y
/// todo va al cambio obligatorio. Se aplica en cada página del panel, así el
/// bloqueo no depende de que el navegador haya descargado el JavaScript.
export function exigirContrasenaActualizada(user: UsuarioSesion): void {
  if (user.debeCambiarContrasena) {
    redirect("/panel/cambiar-mi-contrasena");
  }
}
