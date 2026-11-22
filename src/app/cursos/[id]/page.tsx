import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CourseDetail from "@/components/CourseDetail";
import { prisma } from "@/lib/prisma";
import { DEFAULT_OG_IMAGE, urlSitio } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cursoId = Number(id);
  if (!Number.isInteger(cursoId) || cursoId <= 0) return {};
  try {
    const curso = await prisma.curso.findFirst({
      where: { id: cursoId, activo: true },
      select: { id: true, nombre: true, descripcion: true, imagenUrl: true },
    });
    if (!curso) return {};

    const imagen = curso.imagenUrl || DEFAULT_OG_IMAGE;
    const descripcion = curso.descripcion ?? undefined;

    return {
      title: curso.nombre,
      description: descripcion,
      alternates: {
        canonical: `/cursos/${curso.id}`,
      },
      openGraph: {
        title: curso.nombre,
        description: descripcion,
        url: `${urlSitio()}/cursos/${curso.id}`,
        images: [
          {
            url: imagen,
            alt: curso.nombre,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: curso.nombre,
        description: descripcion,
        images: [imagen],
      },
    };
  } catch {
    return {};
  }
}

export default async function CursoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cursoId = Number(id);

  if (!Number.isInteger(cursoId) || cursoId <= 0) {
    notFound();
  }

  return (
    <>
      <SiteHeader active="cursos" />
      <CourseDetail id={cursoId} />
      <SiteFooter />
    </>
  );
}