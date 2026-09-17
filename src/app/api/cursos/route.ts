import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import {
  CURSO_SELECT,
  validarDatosCurso,
} from "@/lib/cursoAdmin";

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
        sede: true,
        imagenUrl: true,
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

/// Alta de curso (RF-08): solo Administrador y Preceptor.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.CURSOS_CREAR)) {
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

  const resultado = await validarDatosCurso(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  const { docenteIds, activo, ...campos } = resultado.datos;

  try {
    const curso = await prisma.curso.create({
      data: {
        ...campos,
        ...(activo === undefined ? {} : { activo }),
        ...(docenteIds.length > 0
          ? {
              docentes: {
                create: docenteIds.map((docenteId) => ({ docenteId })),
              },
            }
          : {}),
      },
      select: CURSO_SELECT,
    });

    return NextResponse.json({ curso }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}