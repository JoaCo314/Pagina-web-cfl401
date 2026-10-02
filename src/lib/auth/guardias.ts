import { NextResponse } from "next/server";
import type { UsuarioSesion } from "@/lib/auth/session";

/// Bloquea las operaciones de API mientras la contraseña de la cuenta siga siendo
/// temporal (recién creada o blanqueada). Las páginas del panel ya lo hacen con
/// `exigirContrasenaActualizada`; esto cubre el caso de una pestaña que quedó
/// abierta antes del blanqueo: su sesión sigue viva y podría seguir escribiendo.
///
/// Se usa así en cada handler que modifica datos:
///
///   const bloqueado = respuestaSiContrasenaTemporal(user);
///   if (bloqueado) return bloqueado;
///
/// `/api/auth/mi-contrasena` es el único endpoint que debe aceptar el estado
/// "pendiente": es justamente el que resuelve el bloqueo.
export function respuestaSiContrasenaTemporal(
  user: UsuarioSesion | null | undefined
): NextResponse | null {
  if (!user?.debeCambiarContrasena) return null;

  return NextResponse.json(
    { error: "Primero tenés que cambiar tu contraseña temporal." },
    { status: 403 }
  );
}