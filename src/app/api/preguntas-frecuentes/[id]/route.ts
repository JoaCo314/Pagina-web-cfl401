import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import {
  PREGUNTA_SELECT,
  validarPreguntaFrecuente,
} from "@/lib/preguntasFrecuentes";

export const dynamic = "force-dynamic";

function idValido(id: string): number | null {
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/// Edición de pregunta frecuente (panel): Administrador y Preceptor.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const preguntaId = idValido(id);
  if (preguntaId === null) {
    return NextResponse.json(
      { error: "ID de pregunta inválido" },
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

  const existente = await prisma.preguntaFrecuente.findUnique({
    where: { id: preguntaId },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "La pregunta a editar no existe." },
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

  const resultado = await validarPreguntaFrecuente(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  const presentes = new Set(resultado.presentes);
  const sinActivo = {
    pregunta: resultado.datos.pregunta,
    respuesta: resultado.datos.respuesta,
    respuestaHtml: resultado.datos.respuestaHtml ?? null,
    categoriaId: resultado.datos.categoriaId,
    orden: resultado.datos.orden ?? null,
  };
  const data: Record<string, unknown> = {};
  for (const clave of Object.keys(sinActivo)) {
    if (presentes.has(clave)) {
      data[clave] = (sinActivo as Record<string, unknown>)[clave];
    }
  }
  if (presentes.has("activo") && resultado.datos.activo !== undefined) {
    data.activo = resultado.datos.activo;
  }

  try {
    const pregunta = await prisma.preguntaFrecuente.update({
      where: { id: preguntaId },
      data,
      select: PREGUNTA_SELECT,
    });

    return NextResponse.json({ pregunta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/// Eliminación de pregunta frecuente (panel): Administrador y Preceptor.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const preguntaId = idValido(id);
  if (preguntaId === null) {
    return NextResponse.json(
      { error: "ID de pregunta inválido" },
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

  const existente = await prisma.preguntaFrecuente.findUnique({
    where: { id: preguntaId },
    select: { id: true, pregunta: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "La pregunta a eliminar no existe." },
      { status: 404 }
    );
  }

  try {
    await prisma.preguntaFrecuente.delete({ where: { id: preguntaId } });
    return NextResponse.json({ eliminado: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}