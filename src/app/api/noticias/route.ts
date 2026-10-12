import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { respuestaSiContrasenaTemporal } from "@/lib/auth/guardias";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { NOTICIA_SELECT, validarDatosNoticia } from "@/lib/noticiaAdmin";

export const dynamic = "force-dynamic";

/// Máximo de noticias que devuelve el listado público, sin importar el `limit`.
const LIMITE_MAXIMO_NOTICIAS = 100;

/// Listado público de noticias (RF-17). Solo se devuelven las activas, de la
/// más reciente a la más antigua. El panel consulta Prisma directamente para
/// incluir también las inactivas.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Páginas (1-indexadas). `limit` se mantiene como alias de `porPagina`
    // para el home (NoticiasHome), que pide solo las últimas 3.
    const porPaginaParam = Number(searchParams.get("porPagina"));
    const limitParam = Number(searchParams.get("limit"));
    const paginaParam = Number(searchParams.get("pagina"));

    const tamano =
      Number.isInteger(porPaginaParam) && porPaginaParam > 0
        ? porPaginaParam
        : Number.isInteger(limitParam) && limitParam > 0
          ? limitParam
          : 12;
    // Tope duro: el endpoint es público y sin límite cualquiera puede pedir las
    // noticias enteras en una sola respuesta.
    const porPagina = Math.min(tamano, LIMITE_MAXIMO_NOTICIAS);
    const pagina = Number.isInteger(paginaParam) && paginaParam > 0 ? paginaParam : 1;

    const [noticias, total] = await Promise.all([
      prisma.noticia.findMany({
        where: { activo: true },
        select: NOTICIA_SELECT,
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.noticia.count({ where: { activo: true } }),
    ]);

    return NextResponse.json({ noticias, total, pagina, porPagina });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
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

  const bloqueado = respuestaSiContrasenaTemporal(user);
  if (bloqueado) return bloqueado;

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
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}
