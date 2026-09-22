import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { CURSO_SELECT, validarListaDocentes } from "@/lib/cursoAdmin";

export const dynamic = "force-dynamic";

/// Consulta la asignación actual de docentes de un curso (RF-11).
/// Requiere sesión con permiso de ver cursos.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cursoId = Number(id);
  if (!Number.isInteger(cursoId) || cursoId <= 0) {
    return NextResponse.json(
      { error: "ID de curso inválido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!tienePermiso(user, PERMISOS.CURSOS_VER)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const curso = await prisma.curso.findUnique({
    where: { id: cursoId },
    select: CURSO_SELECT,
  });
  if (!curso) {
    return NextResponse.json(
      { error: "El curso solicitado no existe." },
      { status: 404 }
    );
  }

  return NextResponse.json({ curso });
}

/// Asigna/desasigna docentes a un curso (RF-11). Recibe `docenteIds` con la
/// lista completa de docentes que deben quedar asignados (lista vacía =
/// desasignar todos, soporta múltiples docentes). Es idempotente: reemplaza la
/// asignación actual en una transacción. Restricción (RF-12): solo
/// Administrador y Preceptor; un Docente no puede modificar ninguna asignación,
/// ni siquiera la propia.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cursoId = Number(id);
  if (!Number.isInteger(cursoId) || cursoId <= 0) {
    return NextResponse.json(
      { error: "ID de curso inválido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!tienePermiso(user, PERMISOS.CURSOS_ASIGNAR_DOCENTES)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const existente = await prisma.curso.findUnique({
    where: { id: cursoId },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "El curso no existe." },
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

  const norm = await validarListaDocentes(
    (body as Record<string, unknown>)?.docenteIds
  );
  if (!norm.ok) {
    return NextResponse.json({ error: norm.error }, { status: 400 });
  }

  try {
    await prisma.$transaction([
      prisma.cursoDocente.deleteMany({ where: { cursoId } }),
      ...(norm.ids.length > 0
        ? [
            prisma.cursoDocente.createMany({
              data: norm.ids.map((docenteId) => ({ cursoId, docenteId })),
            }),
          ]
        : []),
    ]);

    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: CURSO_SELECT,
    });

    return NextResponse.json({ curso });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}