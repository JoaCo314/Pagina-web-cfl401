import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CourseDetail from "@/components/CourseDetail";

export const dynamic = "force-dynamic";

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