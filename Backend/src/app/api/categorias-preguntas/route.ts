import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { validarCategoriaPregunta } from "@/lib/preguntasFrecuentes";

export const dynamic = "force-dynamic";

/// Listado de categorías de preguntas frecuentes (todas, incluidas inactivas).
/// Usado por el panel para cargar las vistas y los formularios de preguntas.
export async function GET() {
  try {
    const categorias = await prisma.categoriaPregunta.findMany({
      select: {
        id: true,
        nombre: true,
        orden: true,
        activo: true,
        _count: { select: { preguntas: true } },
      },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });

    return NextResponse.json({ categorias });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/// Alta de categoría de preguntas frecuentes (panel): Administrador y Preceptor.
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

  const resultado = validarCategoriaPregunta(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  try {
    const categoria = await prisma.categoriaPregunta.create({
      data: {
        nombre: resultado.valor,
        orden: resultado.orden,
      },
      select: { id: true, nombre: true, orden: true, activo: true },
    });

    return NextResponse.json({ categoria }, { status: 201 });
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