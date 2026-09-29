import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { urlImagenInterna } from "@/lib/imagenes";

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

/// Elimina una imagen subida que ya no se usa. Es la contrapartida de las
/// limpiezas automáticas al reemplazar imágenes: permite recuperar las filas
/// que quedaron huérfanas (por ejemplo, tras cancelar un formulario). No se
/// borra si todavía se referencia en cursos, noticias, la galería de "Sobre
/// el centro" o la configuración del sitio. Administrador y Preceptor.
export async function DELETE(
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

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const puedeBorrar =
    tienePermiso(user, PERMISOS.CURSOS_CREAR) ||
    tienePermiso(user, PERMISOS.NOTICIAS_CREAR);
  if (!puedeBorrar) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const url = urlImagenInterna(imagenId);

  try {
    const [curso, noticia, sobre, config] = await Promise.all([
      prisma.curso.findFirst({
        where: { imagenUrl: url },
        select: { id: true },
      }),
      prisma.noticia.findFirst({
        where: { imagenUrl: url },
        select: { id: true },
      }),
      prisma.sobreElCentro.findFirst({
        select: { id: true, galeria: true },
      }),
      prisma.siteConfig.findUnique({
        where: { id: 1 },
        select: { bannerImagenUrl: true, logoUrl: true },
      }),
    ]);

    const usos: string[] = [];
    if (curso) usos.push("un curso");
    if (noticia) usos.push("una noticia");
    if (
      sobre?.galeria &&
      Array.isArray(sobre.galeria) &&
      (sobre.galeria as { url: string }[]).some((foto) => foto.url === url)
    ) {
      usos.push("la galería de “Sobre el centro”");
    }
    if (config?.bannerImagenUrl === url) usos.push("el banner de la portada");
    if (config?.logoUrl === url) usos.push("el logo");

    if (usos.length > 0) {
      return NextResponse.json(
        {
          error: `La imagen se usa en ${usos.join(", ")}. Reemplazala antes de borrarla.`,
        },
        { status: 409 }
      );
    }

    await prisma.imagen.delete({ where: { id: imagenId } });
    return NextResponse.json({ eliminado: true });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "La imagen no existe." },
        { status: 404 }
      );
    }
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}
