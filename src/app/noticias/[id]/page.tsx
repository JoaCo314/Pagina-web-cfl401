// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticiaDetail from "@/components/NoticiaDetail";
import JsonLd from "@/components/JsonLd";
import { prisma } from "@/lib/prisma";
import { DEFAULT_OG_IMAGE, urlSitio } from "@/lib/meta";
import { generarEsquemaNoticia } from "@/lib/schema";
import { NOTICIA_SELECT } from "@/lib/noticiaAdmin";
import type { Noticia } from "@/lib/noticiaUtils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const noticiaId = Number(id);
  if (!Number.isInteger(noticiaId) || noticiaId <= 0) return {};
  try {
    const noticia = await prisma.noticia.findFirst({
      where: { id: noticiaId, activo: true, borrador: false },
      select: {
        id: true,
        titulo: true,
        resumen: true,
        contenido: true,
        imagenUrl: true,
      },
    });
    if (!noticia) return {};

    const descripcion =
      noticia.resumen ||
      noticia.contenido?.slice(0, 160) ||
      undefined;
    const imagen = noticia.imagenUrl || DEFAULT_OG_IMAGE;

    return {
      title: noticia.titulo,
      description: descripcion,
      alternates: {
        canonical: `/noticias/${noticia.id}`,
      },
      openGraph: {
        type: "article",
        title: noticia.titulo,
        description: descripcion,
        url: `${urlSitio()}/noticias/${noticia.id}`,
        images: [
          {
            url: imagen,
            alt: noticia.titulo,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: noticia.titulo,
        description: descripcion,
        images: [imagen],
      },
    };
  } catch {
    return {};
  }
}

export default async function NoticiaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const noticiaId = Number(id);

  if (!Number.isInteger(noticiaId) || noticiaId <= 0) {
    notFound();
  }

  let noticiaDb = null;
  try {
    noticiaDb = await prisma.noticia.findFirst({
      where: { id: noticiaId, activo: true, borrador: false },
      select: NOTICIA_SELECT,
    });
  } catch {
    // Si la base no está disponible en este momento
  }

  if (!noticiaDb) {
    notFound();
  }

  const noticia: Noticia = {
    ...noticiaDb,
    fecha: noticiaDb.fecha.toISOString(),
    createdAt: noticiaDb.createdAt.toISOString(),
    updatedAt: noticiaDb.updatedAt.toISOString(),
  };

  const schemaNoticia = generarEsquemaNoticia(noticia);

  return (
    <>
      {schemaNoticia && <JsonLd schema={schemaNoticia} />}
      <SiteHeader active="noticias" />
      <main id="contenido" tabIndex={-1}>
        <NoticiaDetail noticiaInicial={noticia} />
      </main>
      <SiteFooter />
    </>
  );
}
