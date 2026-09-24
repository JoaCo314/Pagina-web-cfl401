import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import PreguntaForm, {
  type PreguntaFormInicial,
} from "@/components/panel/PreguntaForm";

export const dynamic = "force-dynamic";

export default async function EditarPreguntaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const preguntaId = Number(id);
  if (!Number.isInteger(preguntaId) || preguntaId <= 0) {
    return notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    redirect("/panel");
  }

  const pregunta = await prisma.preguntaFrecuente.findUnique({
    where: { id: preguntaId },
    select: {
      id: true,
      pregunta: true,
      respuesta: true,
      respuestaHtml: true,
      categoriaId: true,
      orden: true,
      activo: true,
    },
  });

  if (!pregunta) {
    return notFound();
  }

  const categorias = await prisma.categoriaPregunta.findMany({
    select: { id: true, nombre: true, activo: true },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });

  const inicial: PreguntaFormInicial = {
    id: pregunta.id,
    pregunta: pregunta.pregunta,
    respuesta: pregunta.respuesta,
    respuestaHtml: pregunta.respuestaHtml,
    categoriaId: pregunta.categoriaId,
    orden: pregunta.orden,
    activo: pregunta.activo,
  };

  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Editar pregunta</h1>
      <p className="panel-lead">
        Modificá la pregunta <strong>{pregunta.pregunta}</strong>. Los cambios
        se reflejan de inmediato en el sitio.
      </p>
      <PreguntaForm inicial={inicial} categorias={categorias} />
    </PanelShell>
  );
}