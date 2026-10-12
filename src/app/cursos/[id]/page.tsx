import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CourseDetail from "@/components/CourseDetail";
import { prisma } from "@/lib/prisma";

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
      select: { nombre: true, descripcion: true },
    });
    // Sin título específico, el layout publica el título por defecto del sitio.
    return {
      title: curso?.nombre ?? undefined,
      description: curso?.descripcion ?? undefined,
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