// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { respuestaSiContrasenaTemporal } from "@/lib/auth/guardias";

export const dynamic = "force-dynamic";

const LIMITE = 50;

/// Lista los avisos de la cuenta en sesión (los más recientes primero) junto con
/// la cantidad de no leídos. Cada persona ve solo los propios.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const [notificaciones, sinLeer] = await Promise.all([
    prisma.notificacion.findMany({
      where: { usuarioId: user.id },
      orderBy: { createdAt: "desc" },
      take: LIMITE,
      select: {
        id: true,
        tipo: true,
        mensaje: true,
        url: true,
        leida: true,
        createdAt: true,
      },
    }),
    prisma.notificacion.count({
      where: { usuarioId: user.id, leida: false },
    }),
  ]);

  return NextResponse.json({ notificaciones, sinLeer });
}

/// Marca como leída una notificación puntual (`{ id }`) o todas las pendientes
/// (`{ todas: true }`). Siempre acotado a la cuenta en sesión: el `usuarioId`
/// va en el `where`, así no se pueden tocar avisos ajenos ni con el ID a mano.
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
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

  const fuente = (body ?? {}) as Record<string, unknown>;
  const ahora = new Date();

  if (fuente.todas === true) {
    await prisma.notificacion.updateMany({
      where: { usuarioId: user.id, leida: false },
      data: { leida: true, leidaEn: ahora },
    });
  } else if (typeof fuente.id === "number" && Number.isInteger(fuente.id)) {
    const resultado = await prisma.notificacion.updateMany({
      where: { id: fuente.id, usuarioId: user.id },
      data: { leida: true, leidaEn: ahora },
    });
    if (resultado.count === 0) {
      return NextResponse.json(
        { error: "La notificación no existe." },
        { status: 404 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Indicá el id de la notificación o `todas: true`." },
      { status: 400 }
    );
  }

  const sinLeer = await prisma.notificacion.count({
    where: { usuarioId: user.id, leida: false },
  });
  return NextResponse.json({ sinLeer });
}
