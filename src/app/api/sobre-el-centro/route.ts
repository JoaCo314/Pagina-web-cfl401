import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { SOBRE_SELECT, validarSobreElCentro } from "@/lib/sobreElCentro";
import { borrarImagenPorUrl } from "@/lib/imagenes";

export const dynamic = "force-dynamic";

/// Contenido público de la página "Sobre el centro". Solo se sirve la fila
/// activa; si aún no hay contenido editado devuelve `sobre: null`.
export async function GET() {
  try {
    const sobre = await prisma.sobreElCentro.findFirst({
      where: { activo: true },
      select: SOBRE_SELECT,
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ sobre: sobre ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/// Edición del contenido de "Sobre el centro" (sección institucional).
/// El panel envía el formulario completo; las secciones vacías se guardan como
/// null y no se muestran en la vista pública. Restringido a Administrador y
/// Preceptor (permiso SOBRE_EL_CENTRO_EDITAR).
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.SOBRE_EL_CENTRO_EDITAR)) {
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

  const resultado = validarSobreElCentro(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  const existente = await prisma.sobreElCentro.findFirst({
    select: { id: true, galeria: true },
    orderBy: { id: "asc" },
  });

  const datos = resultado.datos;
  const data = {
    intro: datos.intro ?? null,
    introHtml: datos.introHtml ?? null,
    misionTitulo: datos.misionTitulo ?? null,
    misionTexto: datos.misionTexto ?? null,
    misionTextoHtml: datos.misionTextoHtml ?? null,
    historiaTitulo: datos.historiaTitulo ?? null,
    historiaTexto: datos.historiaTexto ?? null,
    historiaTextoHtml: datos.historiaTextoHtml ?? null,
    hitos: datos.hitos ?? Prisma.DbNull,
    estadisticasTitulo: datos.estadisticasTitulo ?? null,
    estadisticas: datos.estadisticas ?? Prisma.DbNull,
    galeriaTitulo: datos.galeriaTitulo ?? null,
    galeria: datos.galeria ?? Prisma.DbNull,
    ...(datos.activo !== undefined ? { activo: datos.activo } : {}),
  };

  try {
    const sobre = existente
      ? await prisma.sobreElCentro.update({
          where: { id: existente.id },
          data,
          select: SOBRE_SELECT,
        })
      : await prisma.sobreElCentro.create({ data, select: SOBRE_SELECT });

    // Limpieza de mejor esfuerzo de fotos de galería que ya no se usan.
    const anteriores =
      existente?.galeria && Array.isArray(existente.galeria)
        ? (existente.galeria as { url: string }[])
        : [];
    const nuevas = new Set(
      (datos.galeria ?? []).map((foto) => foto.url)
    );
    for (const foto of anteriores) {
      if (!nuevas.has(foto.url) && typeof foto.url === "string") {
        await borrarImagenPorUrl(foto.url);
      }
    }

    return NextResponse.json({ sobre });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}