import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import { NOTICIA_SELECT } from "@/lib/noticiaAdmin";
import PanelShell from "@/components/auth/PanelShell";
import NoticiaForm from "@/components/panel/NoticiaForm";
import type { NoticiaFormInicial } from "@/components/panel/NoticiaForm";

export const dynamic = "force-dynamic";

export default async function EditarNoticiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const noticiaId = Number(id);
  if (!Number.isInteger(noticiaId) || noticiaId <= 0) {
    return notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.NOTICIAS_EDITAR)) {
    redirect("/panel");
  }

  const noticia = await prisma.noticia.findUnique({
    where: { id: noticiaId },
    select: NOTICIA_SELECT,
  });

  if (!noticia) {
    return notFound();
  }

  const inicial: NoticiaFormInicial = {
    id: noticia.id,
    titulo: noticia.titulo,
    resumen: noticia.resumen,
    contenido: noticia.contenido,
    fecha: noticia.fecha.toISOString().slice(0, 10),
    imagenUrl: noticia.imagenUrl,
    activo: noticia.activo,
  };

  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Editar noticia</h1>
      <p className="panel-lead">
        Modificá la noticia <strong>{noticia.titulo}</strong>. Los campos no
        enviados conservan su valor actual.
      </p>
      <NoticiaForm inicial={inicial} />
    </PanelShell>
  );
}
