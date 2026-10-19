// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
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

function idValido(id: string): number | null {
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/// Edición de categoría de curso (nombre, orden y activa/inactiva): panel.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const categoriaId = idValido(id);
  if (categoriaId === null) {
    return NextResponse.json(
      { error: "ID de categoría inválido" },
      { status: 400 }
    );
  }

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

  const existente = await prisma.categoriaCurso.findUnique({
    where: { id: categoriaId },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "La categoría a editar no existe." },
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

  const resultado = validarCategoriaCurso(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  const fuente = (body ?? {}) as Record<string, unknown>;
  let activo: boolean | undefined;
  if (fuente.activo !== undefined && fuente.activo !== null) {
    if (typeof fuente.activo !== "boolean") {
      return NextResponse.json(
        { error: "activo debe ser un valor booleano." },
        { status: 400 }
      );
    }
    activo = fuente.activo;
  }

  try {
    const categoria = await prisma.categoriaCurso.update({
      where: { id: categoriaId },
      data: {
        nombre: resultado.valor,
        orden: resultado.orden ?? null,
        ...(activo !== undefined ? { activo } : {}),
      },
      select: { id: true, nombre: true, orden: true, activo: true },
    });

    await registrarAuditoria({
      usuario: user,
      accion: ACCIONES_AUDITORIA.EDITAR,
      recurso: RECURSOS_AUDITORIA.CATEGORIA_CURSO,
      recursoId: categoriaId,
      resumen: `Categoría de curso «${categoria.nombre}»`,
      detalle: { nombre: categoria.nombre, activo: categoria.activo },
      ip: ipCliente(request),
    });

    return NextResponse.json({ categoria });
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

/// Eliminación de categoría. Los cursos que la usaban quedan sin categoría
/// (FK con onDelete: SetNull), no se borran.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const categoriaId = idValido(id);
  if (categoriaId === null) {
    return NextResponse.json(
      { error: "ID de categoría inválido" },
      { status: 400 }
    );
  }

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

  const existente = await prisma.categoriaCurso.findUnique({
    where: { id: categoriaId },
    select: {
      id: true,
      nombre: true,
      _count: { select: { cursos: true } },
    },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "La categoría a eliminar no existe." },
      { status: 404 }
    );
  }

  try {
    await prisma.categoriaCurso.delete({ where: { id: categoriaId } });

    await registrarAuditoria({
      usuario: user,
      accion: ACCIONES_AUDITORIA.ELIMINAR,
      recurso: RECURSOS_AUDITORIA.CATEGORIA_CURSO,
      recursoId: categoriaId,
      resumen: `Categoría de curso «${existente.nombre}»`,
      detalle: { cursosDesasignados: existente._count.cursos },
      ip: ipCliente(request),
    });

    return NextResponse.json({
      eliminado: true,
      cursosDesasignados: existente._count.cursos,
    });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}
