import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/// Sirve una imagen subida desde el panel. Público: el sitio la muestra en las
/// tarjetas y páginas de detalle.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const imagenId = Number(id);
  if (!Number.isInteger(imagenId) || imagenId <= 0) {
    return NextResponse.json(
      { error: "ID de imagen inválido" },
      { status: 400 }
    );
  }

  try {
    const imagen = await prisma.imagen.findUnique({
      where: { id: imagenId },
      select: { datos: true, mimeType: true },
    });

    if (!imagen) {
      return NextResponse.json(
        { error: "La imagen no existe" },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(imagen.datos), {
      status: 200,
      headers: {
        "Content-Type": imagen.mimeType,
        "Content-Length": String(imagen.datos.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}
