import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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