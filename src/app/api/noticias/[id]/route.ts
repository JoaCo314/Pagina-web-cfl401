import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { NOTICIA_SELECT, validarDatosNoticia } from "@/lib/noticiaAdmin";

export const dynamic = "force-dynamic";

/// Detalle público de una noticia: solo si está activa (RF-17).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const noticiaId = Number(id);
  if (!Number.isInteger(noticiaId) || noticiaId <= 0) {
    return NextResponse.json(
      { error: "ID de noticia inválido" },
      { status: 400 }
    );
  }

  try {
    const noticia = await prisma.noticia.findFirst({
      where: { id: noticiaId, activo: true },
      select: NOTICIA_SELECT,
    });

    if (!noticia) {
      return NextResponse.json(
        { error: "La noticia solicitada no existe o no está disponible" },
        { status: 404 }
      );
    }

    return NextResponse.json({ noticia });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/// Edición de noticia (RF-17): Administrador y Preceptor.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const noticiaId = Number(id);
  if (!Number.isInteger(noticiaId) || noticiaId <= 0) {
    return NextResponse.json(
      { error: "ID de noticia inválido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.NOTICIAS_EDITAR)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const existente = await prisma.noticia.findUnique({
    where: { id: noticiaId },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "La noticia a editar no existe." },
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

  const resultado = validarDatosNoticia(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  const { activo, ...campos } = resultado.datos;
  const presentes = new Set(resultado.presentes);

  const data: Record<string, unknown> = {};
  for (const clave of Object.keys(campos)) {
    if (presentes.has(clave)) {
      data[clave] = (campos as Record<string, unknown>)[clave];
    }
  }
  if (presentes.has("activo") && activo !== undefined) {
    data.activo = activo;
  }

  try {
    const noticia = await prisma.noticia.update({
      where: { id: noticiaId },
      data,
      select: NOTICIA_SELECT,
    });

    return NextResponse.json({ noticia });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/// Eliminación de noticia (RF-17): Administrador y Preceptor.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const noticiaId = Number(id);
  if (!Number.isInteger(noticiaId) || noticiaId <= 0) {
    return NextResponse.json(
      { error: "ID de noticia inválido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.NOTICIAS_ELIMINAR)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const existente = await prisma.noticia.findUnique({
    where: { id: noticiaId },
    select: { id: true, titulo: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "La noticia a eliminar no existe." },
      { status: 404 }
    );
  }

  try {
    const noticiaEliminada = await prisma.noticia.delete({
      where: { id: noticiaId },
      select: { id: true, titulo: true },
    });

    return NextResponse.json({ eliminado: true, noticia: noticiaEliminada });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
