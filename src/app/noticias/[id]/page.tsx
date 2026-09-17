import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticiaDetail from "@/components/NoticiaDetail";

export const dynamic = "force-dynamic";

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
