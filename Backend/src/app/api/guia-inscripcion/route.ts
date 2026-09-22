import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { validarContenidosGuia } from "@/lib/contenidoGuia";

export const dynamic = "force-dynamic";

const SELECT_CONTENIDO = {
  clave: true,
  titulo: true,
  contenido: true,
  orden: true,
  activo: true,
} as const;

export async function GET() {
  try {
    const contenidos = await prisma.contenidoGuia.findMany({
      where: { activo: true },
      select: {
        clave: true,
        titulo: true,
        contenido: true,
      },
      orderBy: { orden: "asc" },
    });

    return NextResponse.json({ contenidos, total: contenidos.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/// Edición de la guía de inscripción (RF-05): persiste el título y el
/// contenido de los bloques enviados. Restringido a quienes tienen el permiso
/// GUIA_EDITAR de la matriz (RNF-04): Administrador y Preceptor.
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.GUIA_EDITAR)) {
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

  const resultado = validarContenidosGuia(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  const claves = resultado.contenidos.map((c) => c.clave);
  const existentes = await prisma.contenidoGuia.findMany({
    where: { clave: { in: claves } },
    select: { clave: true },
  });
  if (existentes.length !== claves.length) {
    return NextResponse.json(
      { error: "Algunos bloques de contenido no existen." },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(
      resultado.contenidos.map((c) =>
        prisma.contenidoGuia.update({
          where: { clave: c.clave },
          data: { titulo: c.titulo, contenido: c.contenido },
        })
      )
    );

    const contenidos = await prisma.contenidoGuia.findMany({
      where: { clave: { in: claves } },
      select: SELECT_CONTENIDO,
      orderBy: { orden: "asc" },
    });

    return NextResponse.json({ contenidos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}