import { NextRequest, NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  tienePermiso,
  type Permiso,
} from "@/lib/auth/autorizacion";
import { USUARIO_SELECT, validarDatosUsuario } from "@/lib/usuariosAdmin";

export const dynamic = "force-dynamic";

/// Permiso específico necesario para crear cada rol (RF-13/RF-14).
/// Administrador: puede crear Administrador, Preceptor y Docente.
/// Preceptor: solo Docente. El Docente no crea usuarios.
const PERMISO_POR_ROL: Record<string, Permiso> = {
  Administrador: PERMISOS.USUARIOS_CREAR_ADMIN,
  Preceptor: PERMISOS.USUARIOS_CREAR_PRECEPTOR,
  Docente: PERMISOS.USUARIOS_CREAR_DOCENTE,
};

/// Creación de usuario (RF-13/RF-14): solo Administrador y Preceptor crean
/// cuentas y respetando la jerarquía: el Administrador crea cualquier rol y el
/// Preceptor solo Docentes. La validación de jerarquía siempre antecede a la de
/// datos, de modo que una petición sin permiso para el rol reciba 403.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.USUARIOS_CREAR)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida: se esperaba un JSON." },
      { status: 400 }
    );
  }

  const fuente = (body ?? {}) as Record<string, unknown>;
  const rolPeticion =
    typeof fuente.rol === "string" ? fuente.rol.trim() : "";

  const permisoRol = PERMISO_POR_ROL[rolPeticion];
  if (!permisoRol) {
    return NextResponse.json(
      { error: "El rol elegido no existe o no es válido." },
      { status: 400 }
    );
  }

  if (!tienePermiso(user, permisoRol)) {
    return NextResponse.json(
      { error: "No tenés permiso para crear usuarios con ese rol." },
      { status: 403 }
    );
  }

  const resultado = await validarDatosUsuario(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  const { nombre, apellido, email, password, rol, activo } = resultado.datos;

  const existente = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existente) {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese email." },
      { status: 409 }
    );
  }

  const rolDb = await prisma.rol.findUnique({
    where: { nombre: rol },
    select: { id: true },
  });
  if (!rolDb) {
    return NextResponse.json(
      { error: "El rol no existe." },
      { status: 400 }
    );
  }

  try {
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        passwordHash: hashSync(password, 10),
        activo: activo ?? true,
        rolId: rolDb.id,
      },
      select: USUARIO_SELECT,
    });

    return NextResponse.json({ usuario }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}