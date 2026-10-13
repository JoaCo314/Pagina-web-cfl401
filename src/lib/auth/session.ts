import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  crearTokenSesion,
  verificarTokenSesion,
} from "@/lib/auth/token";

// La emisión/verificación del token vive en `token.ts` (sin Prisma ni
// `next/headers`) para que el middleware pueda usarla en el runtime Edge. Acá
// se reexporta para no cambiar los importadores existentes.
export { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, crearTokenSesion, verificarTokenSesion };

export type UsuarioSesion = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  debeCambiarContrasena: boolean;
  rol: { nombre: string; nivel: number };
};

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
