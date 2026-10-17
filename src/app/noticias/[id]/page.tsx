// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticiaDetail from "@/components/NoticiaDetail";
import { prisma } from "@/lib/prisma";

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
      select: { titulo: true, resumen: true, contenido: true },
    });
    if (!noticia) return {};
    return {
      title: noticia.titulo,
      description:
        noticia.resumen ||
        noticia.contenido?.slice(0, 160) ||
        undefined,
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

  return (
    <>
      <SiteHeader active="noticias" />
      <NoticiaDetail id={noticiaId} />
      <SiteFooter />
    </>
  );
}
