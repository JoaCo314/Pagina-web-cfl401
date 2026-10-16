// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { respuestaSiContrasenaTemporal } from "@/lib/auth/guardias";
import { puedeGestionarUsuario, PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import {
  contrasenaTemporalDesdeDni,
  hashPassword,
} from "@/lib/auth/password";
import { ipCliente } from "@/lib/auth/rateLimit";
import {
  ACCIONES_AUDITORIA,
  RECURSOS_AUDITORIA,
  registrarAuditoria,
} from "@/lib/auditoria";
import { USUARIO_SELECT, limpiarObligatorio } from "@/lib/usuariosAdmin";
import { esEmailValido, REGEX_DNI } from "@/lib/validaciones";

export const dynamic = "force-dynamic";

/// Edición básica de usuario (RF-15): desactivar o reactivar una cuenta,
/// corregir el DNI, editar nombre, apellido y email, y blanquear la contraseña.
/// El Administrador puede hacerlo sobre cualquier cuenta; el Preceptor solo
/// sobre cuentas con rol Docente. La desactivación impide iniciar sesión y
/// revoca las sesiones activas (getCurrentUser filtra por `activo`).
///
/// El blanqueo nunca recibe una contraseña escrita por el administrador: la
/// contraseña temporal siempre se deriva del DNI (últimos 4 dígitos) y la
/// cuenta queda marcada para que el usuario la cambie al próximo ingreso.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const usuarioId = Number(id);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return NextResponse.json(
      { error: "ID de usuario inválido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const existente = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      email: true,
      bloqueada: true,
      debeCambiarContrasena: true,
      rol: { select: { nombre: true } },
    },
  });
  // Orden deliberado para no revelar cuentas fuera del alcance del usuario:
  // primero se decide si "podría" gestionarla, y solo después si existe. Así un
  // Preceptor recibe 403 tanto por un ID inexistente como por una cuenta de
  // Administrador/Preceptor: no hay forma de distinguir cuál es cuál.
  if (!puedeGestionarUsuario(user, existente)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  if (!existente) {
    return NextResponse.json(
      { error: "El usuario no existe." },
      { status: 404 }
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

  if (fuente.password !== undefined) {
    return NextResponse.json(
      {
        error:
          "No se puede asignar una contraseña escrita a mano. Usá la acción para blanquear la contraseña.",
      },
      { status: 400 }
    );
  }

  if (fuente.accion !== undefined && fuente.accion !== "blanquearContrasena") {
    return NextResponse.json(
      { error: "Acción desconocida." },
      { status: 400 }
    );
  }

  if (fuente.accion === "blanquearContrasena") {
    if (usuarioId === user.id) {
      return NextResponse.json(
        {
          error:
            "No podés blanquear tu propia contraseña. Usá «Cambiar mi contraseña».",
        },
        { status: 400 }
      );
    }
    const contrasenaTemporal = contrasenaTemporalDesdeDni(existente.dni);
    if (!tienePermiso(user, PERMISOS.USUARIOS_DESACTIVAR)) {
      return NextResponse.json(
        { error: "No tenés permiso para blanquear contraseñas." },
        { status: 403 }
      );
    }
    try {
      const usuario = await prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          passwordHash: hashPassword(contrasenaTemporal),
          debeCambiarContrasena: true,
          // Invalida las sesiones abiertas de esa cuenta en otros equipos.
          versionSesion: { increment: 1 },
        },
        select: USUARIO_SELECT,
      });

      await registrarAuditoria({
        usuario: user,
        accion: ACCIONES_AUDITORIA.BLANQUEAR,
        recurso: RECURSOS_AUDITORIA.USUARIO,
        recursoId: usuarioId,
        resumen: `Usuario «${existente.nombre} ${existente.apellido}»`,
        detalle: { contrasena: "temporal (últimos 4 del DNI)" },
        ip: ipCliente(request),
      });

      return NextResponse.json({ usuario });
    } catch (err) {
      console.error("[API] Error interno:", err);
      return NextResponse.json(
        { error: "Ocurrió un error interno. Intentá nuevamente." },
        { status: 500 }
      );
    }
  }

  const cambios: Record<string, unknown> = {};

  if (fuente.activo !== undefined) {
    if (typeof fuente.activo !== "boolean") {
      return NextResponse.json(
        { error: "El campo activo debe ser un valor booleano." },
        { status: 400 }
      );
    }
    if (!tienePermiso(user, PERMISOS.USUARIOS_DESACTIVAR)) {
      return NextResponse.json(
        { error: "No tenés permiso para activar o desactivar cuentas." },
        { status: 403 }
      );
    }
    if (usuarioId === user.id) {
      return NextResponse.json(
        { error: "No podés desactivar tu propia cuenta." },
        { status: 400 }
      );
    }
    cambios.activo = fuente.activo;
    // Si se reactiva una cuenta que había quedado bloqueada por intentos
    // fallidos, se limpia también el bloqueo: es la única forma de levantarlo.
    if (fuente.activo === true) {
      cambios.bloqueada = false;
      cambios.bloqueadaEn = null;
    }
  }

  if (fuente.dni !== undefined) {
    if (typeof fuente.dni !== "string" || !REGEX_DNI.test(fuente.dni.trim())) {
      return NextResponse.json(
        { error: "El DNI debe tener 7 u 8 dígitos." },
        { status: 400 }
      );
    }
    const dni = fuente.dni.trim();
    if (dni !== existente.dni) {
      const dniEnUso = await prisma.usuario.findUnique({
        where: { dni },
        select: { id: true },
      });
      if (dniEnUso) {
        return NextResponse.json(
          { error: "Ya existe un usuario con ese DNI." },
          { status: 409 }
        );
      }
      cambios.dni = dni;

      // Si la cuenta está con contraseña temporal, esa contraseña deriva del DNI.
      // Corregir el DNI tiene que rehacerla: si no, el usuario podría quedarse
      // con una contraseña que no conoce.
      if (existente.debeCambiarContrasena) {
        cambios.passwordHash = hashPassword(contrasenaTemporalDesdeDni(dni));
      }
    }
  }

  // Datos de identidad editables desde el panel (RF-15): nombre, apellido y
  // email. El DNI tiene su propio editor rápido (por eso se valida por separado).
  // Se registran los nombres de los campos tocados para la auditoría, pero no
  // los valores (son datos personales).
  const camposEditados: string[] = [];

  if (fuente.nombre !== undefined) {
    const nombreCampo = limpiarObligatorio(fuente.nombre, "El nombre", 100);
    if (nombreCampo.error) {
      return NextResponse.json({ error: nombreCampo.error }, { status: 400 });
    }
    if (nombreCampo.valor !== existente.nombre) {
      cambios.nombre = nombreCampo.valor;
      camposEditados.push("nombre");
    }
  }

  if (fuente.apellido !== undefined) {
    const apellidoCampo = limpiarObligatorio(
      fuente.apellido,
      "El apellido",
      100
    );
    if (apellidoCampo.error) {
      return NextResponse.json({ error: apellidoCampo.error }, { status: 400 });
    }
    if (apellidoCampo.valor !== existente.apellido) {
      cambios.apellido = apellidoCampo.valor;
      camposEditados.push("apellido");
    }
  }

  if (fuente.email !== undefined) {
    const emailCampo = limpiarObligatorio(fuente.email, "El email", 200);
    if (emailCampo.error) {
      return NextResponse.json({ error: emailCampo.error }, { status: 400 });
    }
    const email = emailCampo.valor.toLowerCase();
    if (!esEmailValido(email)) {
      return NextResponse.json(
        { error: "El email no tiene un formato válido." },
        { status: 400 }
      );
    }
    if (email !== existente.email) {
      // La unicidad del email es case-insensitive en la base; para dar un 409
      // claro se busca ignorando mayúsculas antes de intentar el update.
      const emailEnUso = await prisma.usuario.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      });
      if (emailEnUso) {
        return NextResponse.json(
          { error: "Ya existe un usuario con ese email." },
          { status: 409 }
        );
      }
      cambios.email = email;
      camposEditados.push("email");
    }
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json(
      { error: "No se enviaron campos para actualizar." },
      { status: 400 }
    );
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: cambios,
      select: USUARIO_SELECT,
    });

    const nombre = `Usuario «${usuario.nombre} ${usuario.apellido}»`;
    if (cambios.activo !== undefined) {
      await registrarAuditoria({
        usuario: user,
        accion: cambios.activo
          ? ACCIONES_AUDITORIA.ACTIVAR
          : ACCIONES_AUDITORIA.DESACTIVAR,
        recurso: RECURSOS_AUDITORIA.USUARIO,
        recursoId: usuarioId,
        resumen: nombre,
        detalle:
          cambios.activo && existente.bloqueada
            ? { desbloqueo: "por intentos fallidos" }
            : undefined,
        ip: ipCliente(request),
      });
    }
    if (cambios.dni !== undefined) {
      await registrarAuditoria({
        usuario: user,
        accion: ACCIONES_AUDITORIA.EDITAR,
        recurso: RECURSOS_AUDITORIA.USUARIO,
        recursoId: usuarioId,
        resumen: nombre,
        // No se guarda el DNI (dato personal): solo se deja constancia del
        // cambio de identidad y de si la contraseña temporal se recalculó.
        detalle: {
          campo: "dni",
          contrasenaTemporalRecalculada: Boolean(cambios.passwordHash),
        },
        ip: ipCliente(request),
      });
    }
    if (camposEditados.length > 0) {
      await registrarAuditoria({
        usuario: user,
        accion: ACCIONES_AUDITORIA.EDITAR,
        recurso: RECURSOS_AUDITORIA.USUARIO,
        recursoId: usuarioId,
        resumen: nombre,
        // Solo los nombres de los campos: los valores son datos personales.
        detalle: { campos: camposEditados.join(", ") },
        ip: ipCliente(request),
      });
    }

    return NextResponse.json({ usuario });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const objetivo = err.meta?.target;
      const campos = Array.isArray(objetivo)
        ? objetivo.map(String)
        : [String(objetivo ?? "")];
      const mensaje = campos.includes("email")
        ? "Ya existe un usuario con ese email."
        : "Ya existe un usuario con ese DNI.";
      return NextResponse.json({ error: mensaje }, { status: 409 });
    }
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}

/// Eliminación definitiva de una cuenta (RF-15). Reglas:
///   - Solo el Administrador (permiso USUARIOS_ELIMINAR): es irreversible.
///   - La cuenta tiene que estar desactivada primero (RF-15): obliga a pasar por
///     el paso reversible antes de borrar, para evitar bajas por accidente.
///   - No se puede eliminar la propia cuenta.
///   - Si todavía tiene cursos asignados se rechaza: primero hay que
///     reasignarlos, así no quedan cursos sin docente por un borrado.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const usuarioId = Number(id);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return NextResponse.json(
      { error: "ID de usuario inválido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const existente = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      activo: true,
      rol: { select: { nombre: true } },
      _count: { select: { cursosAsignados: true } },
    },
  });

  // Mismo orden que en el resto del endpoint: alcance antes que existencia para
  // no revelar cuentas fuera del alcance del usuario.
  if (!puedeGestionarUsuario(user, existente)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  if (!existente) {
    return NextResponse.json(
      { error: "El usuario no existe." },
      { status: 404 }
    );
  }

  if (!tienePermiso(user, PERMISOS.USUARIOS_ELIMINAR)) {
    return NextResponse.json(
      { error: "No tenés permiso para eliminar cuentas." },
      { status: 403 }
    );
  }

  const bloqueado = respuestaSiContrasenaTemporal(user);
  if (bloqueado) return bloqueado;

  if (usuarioId === user.id) {
    return NextResponse.json(
      { error: "No podés eliminar tu propia cuenta." },
      { status: 400 }
    );
  }

  if (existente.activo) {
    return NextResponse.json(
      {
        error:
          "Primero desactivá la cuenta: solo se pueden eliminar usuarios inactivos.",
      },
      { status: 409 }
    );
  }

  if (existente._count.cursosAsignados > 0) {
    return NextResponse.json(
      {
        error:
          "La cuenta todavía tiene cursos asignados. Reasigná esos cursos a otro docente antes de eliminarla.",
      },
      { status: 409 }
    );
  }

  try {
    await prisma.usuario.delete({ where: { id: usuarioId } });

    // El registro de auditoría guarda un snapshot del email/nombre como texto,
    // así que sigue siendo legible después de borrar la cuenta (no hay FK).
    await registrarAuditoria({
      usuario: user,
      accion: ACCIONES_AUDITORIA.ELIMINAR,
      recurso: RECURSOS_AUDITORIA.USUARIO,
      recursoId: usuarioId,
      resumen: `Usuario «${existente.nombre} ${existente.apellido}»`,
      detalle: { rol: existente.rol.nombre, email: existente.email },
      ip: ipCliente(request),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: la cuenta tiene registros asociados. Reasignalos antes de intentar de nuevo.",
        },
        { status: 409 }
      );
    }
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}