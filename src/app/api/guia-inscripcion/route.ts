import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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