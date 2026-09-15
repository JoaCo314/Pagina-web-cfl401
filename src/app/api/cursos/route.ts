import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    const groupBy = searchParams.get("groupBy");

    const cursos = await prisma.curso.findMany({
      where: { activo: true, ...(categoria ? { categoria } : {}) },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        categoria: true,
        cupos: true,
        modalidad: true,
        horarios: true,
        mesesCursada: true,
        fechaInicio: true,
        docentes: {
          include: {
            docente: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    });

    if (groupBy === "categoria") {
      const grupos = new Map<string, (typeof cursos)[number][]>();
      for (const curso of cursos) {
        const clave = curso.categoria ?? "Sin categoría";
        const lista = grupos.get(clave) ?? [];
        lista.push(curso);
        grupos.set(clave, lista);
      }

      const categorias = Array.from(grupos.entries()).map(
        ([nombre, cursosDeCategoria]) => ({
          categoria: nombre,
          cursos: cursosDeCategoria,
        })
      );

      return NextResponse.json({ categorias, total: cursos.length });
    }

    return NextResponse.json({ cursos, total: cursos.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}