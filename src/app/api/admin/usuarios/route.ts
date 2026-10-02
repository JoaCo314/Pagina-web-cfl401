import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { respuestaSiContrasenaTemporal } from "@/lib/auth/guardias";
import {
  alcanceUsuarios,
  filtroUsuariosVisibles,
  PERMISOS,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import {
  contrasenaTemporalDesdeDni,
  hashPassword,
} from "@/lib/auth/password";
import {
  NOMBRE_ROL_A_PERMISO_CREAR,
  USUARIO_SELECT,
  validarDatosUsuario,
} from "@/lib/usuariosAdmin";

export const dynamic = "force-dynamic";

/// Listado de usuarios (RF-15). El Administrador ve el listado completo; el
/// Preceptor ve únicamente las cuentas con rol Docente (mismo alcance que
/// puede usar para gestionarlas). El resto de los roles recibe 403.
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (alcanceUsuarios(user) === "ninguno") {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  try {
    const usuarios = await prisma.usuario.findMany({
      where: filtroUsuariosVisibles(user),
      select: USUARIO_SELECT,
      orderBy: [{ rol: { nivel: "desc" } }, { apellido: "asc" }],
    });

    return NextResponse.json({
      usuarios,
      total: usuarios.length,
      alcance: alcanceUsuarios(user),
    });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}

/// Creación de usuario (RF-13/RF-14): solo Administrador y Preceptor crean
/// cuentas y respetando la jerarquía: el Administrador crea cualquier rol y el
/// Preceptor solo Docentes. La validación de jerarquía siempre antecede a la de
/// datos, de modo que una petición sin permiso para el rol reciba 403.
///
/// La contraseña inicial no la elige quien crea la cuenta: es la temporal por
/// defecto (últimos 4 dígitos del DNI) y la cuenta queda marcada para que el
/// usuario la cambie al primer ingreso.
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

  const bloqueado = respuestaSiContrasenaTemporal(user);
  if (bloqueado) return bloqueado;

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

  const { nombre, apellido, dni, email, rol, activo } = resultado.datos;

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

  const dniExistente = await prisma.usuario.findUnique({
    where: { dni },
    select: { id: true },
  });
  if (dniExistente) {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese DNI." },
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

  const contrasenaTemporal = contrasenaTemporalDesdeDni(dni);

  try {
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        dni,
        email,
        passwordHash: hashPassword(contrasenaTemporal),
        debeCambiarContrasena: true,
        activo: activo ?? true,
        rolId: rolDb.id,
      },
      select: USUARIO_SELECT,
    });

    // No se devuelve la contraseña temporal: quien da de alta ya conoce el DNI
    // que ingresó y puede leer los últimos 4 dígitos de la columna DNI.
    return NextResponse.json({ usuario }, { status: 201 });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}