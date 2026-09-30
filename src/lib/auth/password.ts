import { compareSync, hashSync } from "bcryptjs";

export function hashPassword(password: string): string {
  return hashSync(password, 10);
}

export function verificarPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

/// Contraseña temporal por defecto de una cuenta: los últimos 4 dígitos del DNI.
/// Es la única fuente de contraseñas temporales (alta de usuario y blanqueo), así
/// el personal no elige ni escribe contraseñas ajenas.
export function contrasenaTemporalDesdeDni(dni: string): string {
  return dni.replace(/\D/g, "").slice(-4);
}