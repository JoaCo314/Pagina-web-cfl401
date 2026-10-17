// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { respuestaSiContrasenaTemporal } from "@/lib/auth/guardias";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { validarCategoriaCurso } from "@/lib/categoriasCursos";
import { ipCliente } from "@/lib/auth/rateLimit";
import {
  ACCIONES_AUDITORIA,
  RECURSOS_AUDITORIA,
  registrarAuditoria,
} from "@/lib/auditoria";

export const dynamic = "force-dynamic";

/// Listado de categorías de cursos (todas, incluidas inactivas). Es un endpoint
/// de panel: requiere sesión y permiso de categorías de cursos.
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.CURSOS_CATEGORIAS)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  if (user.debeCambiarContrasena) {
    return NextResponse.json(
      { error: "Primero tenés que cambiar tu contraseña temporal." },
      { status: 403 }
    );
  }

  try {
    const categorias = await prisma.categoriaCurso.findMany({
      select: {
        id: true,
        nombre: true,
        orden: true,
        activo: true,
        _count: { select: { cursos: true } },
      },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });

    return NextResponse.json({ categorias });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}

/// Alta de categoría de curso (panel): Administrador y Preceptor.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.CURSOS_CATEGORIAS)) {
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

  const resultado = validarCategoriaCurso(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  try {
    const categoria = await prisma.categoriaCurso.create({
      data: {
        nombre: resultado.valor,
        orden: resultado.orden,
      },
      select: { id: true, nombre: true, orden: true, activo: true },
    });

    await registrarAuditoria({
      usuario: user,
      accion: ACCIONES_AUDITORIA.CREAR,
      recurso: RECURSOS_AUDITORIA.CATEGORIA_CURSO,
      recursoId: categoria.id,
      resumen: `Categoría de curso «${categoria.nombre}»`,
      ip: ipCliente(request),
    });

    return NextResponse.json({ categoria }, { status: 201 });
  } catch (err) {
    console.error("[API] Error interno:", err);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}
