import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { NOTICIA_SELECT, validarDatosNoticia } from "@/lib/noticiaAdmin";

export const dynamic = "force-dynamic";

/// Listado público de noticias (RF-17). Solo se devuelven las activas, de la
/// más reciente a la más antigua. El panel consulta Prisma directamente para
/// incluir también las inactivas.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limiteParam = Number(searchParams.get("limit"));
    const take =
      Number.isInteger(limiteParam) && limiteParam > 0 ? limiteParam : undefined;

    const noticias = await prisma.noticia.findMany({
      where: { activo: true },
      select: NOTICIA_SELECT,
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      ...(take ? { take } : {}),
    });

    return NextResponse.json({ noticias, total: noticias.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/// Alta de noticia (RF-17): Administrador y Preceptor.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.NOTICIAS_CREAR)) {
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

  const resultado = validarDatosNoticia(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  const { activo, ...campos } = resultado.datos;

  try {
    const noticia = await prisma.noticia.create({
      data: {
        ...campos,
        ...(activo === undefined ? {} : { activo }),
      },
      select: NOTICIA_SELECT,
    });

    return NextResponse.json({ noticia }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
