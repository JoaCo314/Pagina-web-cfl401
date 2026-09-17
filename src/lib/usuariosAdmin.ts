import {
  PERMISOS,
  tienePermiso,
  type Permiso,
} from "@/lib/auth/autorizacion";
import type { UsuarioSesion } from "@/lib/auth/session";

/// Permiso específico necesario para crear cada rol (RF-13/RF-14).
/// Administrador: puede crear Administrador, Preceptor y Docente.
/// Preceptor: solo Docente. El Docente no crea usuarios.
export const NOMBRE_ROL_A_PERMISO_CREAR: Record<string, Permiso> = {
  Administrador: PERMISOS.USUARIOS_CREAR_ADMIN,
  Preceptor: PERMISOS.USUARIOS_CREAR_PRECEPTOR,
  Docente: PERMISOS.USUARIOS_CREAR_DOCENTE,
};

/// Roles que el usuario puede crear según la matriz de permisos. Se usa en el
/// formulario de alta para mostrar solamente las opciones habilitadas.
export function rolesQuePuedeCrear(usuario: UsuarioSesion): string[] {
  return Object.entries(NOMBRE_ROL_A_PERMISO_CREAR)
    .filter(([, permiso]) => tienePermiso(usuario, permiso))
    .map(([nombre]) => nombre);
}

/// Selección estándar de un usuario para respuestas del panel (sin hash).
export const USUARIO_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  activo: true,
  rol: { select: { nombre: true, nivel: true } },
  createdAt: true,
  updatedAt: true,
} as const;

export type UsuarioInputNormalizado = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: string;
  activo: boolean | undefined;
};

export type ResultadoDatosUsuario =
  | { ok: true; datos: UsuarioInputNormalizado }
  | { ok: false; error: string };

function limpiarObligatorio(
  valor: unknown,
  etiqueta: string,
  max: number
): { error?: string; valor: string } {
  if (typeof valor !== "string" || !valor.trim()) {
    return { error: `${etiqueta} es obligatorio.`, valor: "" };
  }
  const texto = valor.trim();
  if (texto.length > max) {
    return {
      error: `${etiqueta} no puede superar ${max} caracteres.`,
      valor: "",
    };
  }
  return { valor: texto };
}

/// Valida y normaliza el cuerpo de creación de un usuario (RF-13/RF-14).
/// La jerarquía de roles (qué rol puede crear a quién) se valida en el
/// endpoint usando la matriz de permisos (`USUARIOS_CREAR_*`).
export async function validarDatosUsuario(
  input: unknown
): Promise<ResultadoDatosUsuario> {
  const fuente = (input ?? {}) as Record<string, unknown>;

  const nombre = limpiarObligatorio(fuente.nombre, "El nombre", 100);
  if (nombre.error) return { ok: false, error: nombre.error };

  const apellido = limpiarObligatorio(fuente.apellido, "El apellido", 100);
  if (apellido.error) return { ok: false, error: apellido.error };

  const email = limpiarObligatorio(fuente.email, "El email", 200);
  if (email.error) return { ok: false, error: email.error };
  const emailNormalizado = email.valor.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
    return { ok: false, error: "El email no tiene un formato válido." };
  }

  const password = limpiarObligatorio(fuente.password, "La contraseña", 100);
  if (password.error) return { ok: false, error: password.error };
  if (password.valor.length < 8) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  const rol = limpiarObligatorio(fuente.rol, "El rol", 50);
  if (rol.error) return { ok: false, error: rol.error };

  let activo: boolean | undefined;
  if (fuente.activo !== undefined && fuente.activo !== null) {
    if (typeof fuente.activo !== "boolean") {
      return { ok: false, error: "activo debe ser un valor booleano." };
    }
    activo = fuente.activo;
  }

  return {
    ok: true,
    datos: {
      nombre: nombre.valor,
      apellido: apellido.valor,
      email: emailNormalizado,
      password: password.valor,
      rol: rol.valor,
      activo,
    },
  };
}