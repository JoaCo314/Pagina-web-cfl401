import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { validarCategoriaPregunta } from "@/lib/preguntasFrecuentes";

export const dynamic = "force-dynamic";

function idValido(id: string): number | null {
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/// Edición de categoría (nombre, orden y activa/inactiva): panel.
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

  if (!tienePermiso(user, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const existente = await prisma.categoriaPregunta.findUnique({
    where: { id: categoriaId },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "La categoría a editar no existe." },
      { status: 404 }
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

  const resultado = validarCategoriaPregunta(body);
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
    const categoria = await prisma.categoriaPregunta.update({
      where: { id: categoriaId },
      data: {
        nombre: resultado.valor,
        orden: resultado.orden ?? null,
        ...(activo !== undefined ? { activo } : {}),
      },
      select: { id: true, nombre: true, orden: true, activo: true },
    });

    return NextResponse.json({ categoria });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    const duplicada =
      message.includes("Unique constraint") || message.includes("unique");
    if (duplicada) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/// Eliminación de categoría: se eliminan también sus preguntas (cascade).
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

  if (!tienePermiso(user, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const existente = await prisma.categoriaPregunta.findUnique({
    where: { id: categoriaId },
    select: {
      id: true,
      nombre: true,
      _count: { select: { preguntas: true } },
    },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "La categoría a eliminar no existe." },
      { status: 404 }
    );
  }

  try {
    await prisma.categoriaPregunta.delete({ where: { id: categoriaId } });
    return NextResponse.json({ eliminado: true, preguntas: existente._count.preguntas });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}