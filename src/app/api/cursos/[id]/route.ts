import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { CURSO_SELECT, validarDatosCurso } from "@/lib/cursoAdmin";

export const dynamic = "force-dynamic";

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

  try {
    const curso = await prisma.curso.findFirst({
      where: { id: cursoId, activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        modalidad: true,
        horarios: true,
        mesesCursada: true,
        fechaInicio: true,
        programaContenidos: true,
        categoria: true,
        cupos: true,
        imagenUrl: true,
        informacionAdicional: true,
        createdAt: true,
        updatedAt: true,
        docentes: {
          include: {
            docente: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!curso) {
      return NextResponse.json(
        { error: "El curso solicitado no existe o no está disponible" },
        { status: 404 }
      );
    }

    return NextResponse.json({ curso });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/// Edición de curso (RF-09, parte admin/preceptor): cualquier curso,
/// incluyendo la reasignación de docentes. Los docentes se manejan por
/// separado (solo sus cursos asignados) en su correspondiente tarea.
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

  if (!tienePermiso(user, PERMISOS.CURSOS_EDITAR)) {
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
      { error: "El curso a editar no existe." },
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

  const resultado = await validarDatosCurso(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  const { docenteIds, activo, ...campos } = resultado.datos;
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
  const reasignarDocentes = presentes.has("docenteIds");

  try {
    await prisma.$transaction([
      prisma.curso.update({
        where: { id: cursoId },
        data,
      }),
      ...(reasignarDocentes
        ? [prisma.cursoDocente.deleteMany({ where: { cursoId } })]
        : []),
      ...(reasignarDocentes && docenteIds.length > 0
        ? [
            prisma.cursoDocente.createMany({
              data: docenteIds.map((docenteId) => ({ cursoId, docenteId })),
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

/// Eliminación de curso (RF-10): solo Administrador y Preceptor.
/// Un Docente no puede eliminar ningún curso, ni siquiera los que tiene
/// asignados (RF-10/RF-16). Las asignaciones de docentes (CursoDocente) se
/// borran en cascada junto con el curso.
export async function DELETE(
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

  if (!tienePermiso(user, PERMISOS.CURSOS_ELIMINAR)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const existente = await prisma.curso.findUnique({
    where: { id: cursoId },
    select: { id: true, nombre: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "El curso a eliminar no existe." },
      { status: 404 }
    );
  }

  try {
    // CursoDocente se elimina en cascada al borrar el curso (onDelete: Cascade).
    const cursoEliminado = await prisma.curso.delete({
      where: { id: cursoId },
      select: { id: true, nombre: true },
    });

    return NextResponse.json({ eliminado: true, curso: cursoEliminado });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}