import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import {
  PREGUNTA_SELECT,
  validarPreguntaFrecuente,
} from "@/lib/preguntasFrecuentes";

export const dynamic = "force-dynamic";

/// Preguntas frecuentes públicas (RF: sección /preguntas-frecuentes).
/// Devuelve solo categorías activas con sus preguntas activas, ordenadas por
/// `orden`. Las categorías sin preguntas activas se excluyen.
export async function GET() {
  try {
    const categorias = await prisma.categoriaPregunta.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        preguntas: {
          where: { activo: true },
          select: { id: true, pregunta: true, respuesta: true, respuestaHtml: true },
          orderBy: [{ orden: "asc" }, { pregunta: "asc" }],
        },
      },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });

    const visibles = categorias.filter((c) => c.preguntas.length > 0);
    return NextResponse.json({ categorias: visibles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/// Alta de pregunta frecuente (panel): Administrador y Preceptor.
export async function POST(request: NextRequest) {
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

  try {
    const pregunta = await prisma.preguntaFrecuente.create({
      data: {
        pregunta: resultado.datos.pregunta,
        respuesta: resultado.datos.respuesta,
        respuestaHtml: resultado.datos.respuestaHtml ?? null,
        categoriaId: resultado.datos.categoriaId,
        orden: resultado.datos.orden,
        ...(resultado.datos.activo !== undefined
          ? { activo: resultado.datos.activo }
          : {}),
      },
      select: PREGUNTA_SELECT,
    });

    return NextResponse.json({ pregunta }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}