import { NextRequest, NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import {
  NOMBRE_ROL_A_PERMISO_CREAR,
  USUARIO_SELECT,
  validarDatosUsuario,
} from "@/lib/usuariosAdmin";

export const dynamic = "force-dynamic";

/// Listado completo de usuarios (RF-15): exclusivo de Administrador. El
/// Preceptor no puede ver el listado del equipo (matriz RNF-04).
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.USUARIOS_VER_TODOS)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  try {
    const usuarios = await prisma.usuario.findMany({
      select: USUARIO_SELECT,
      orderBy: [{ rol: { nivel: "desc" } }, { apellido: "asc" }],
    });

    return NextResponse.json({ usuarios, total: usuarios.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

  const permisoRol = NOMBRE_ROL_A_PERMISO_CREAR[rolPeticion];
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