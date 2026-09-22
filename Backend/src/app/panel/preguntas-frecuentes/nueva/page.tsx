import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import PreguntaForm from "@/components/panel/PreguntaForm";

export const dynamic = "force-dynamic";

export default async function NuevaPreguntaPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    redirect("/panel");
  }

  const categorias = await prisma.categoriaPregunta.findMany({
    select: { id: true, nombre: true, activo: true },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });

  if (categorias.length === 0) {
    return (
      <PanelShell user={user} secciones={obtenerSeccionesPanel(user)}>
        <div className="panel-head">
          <h1 className="panel-title">Nueva pregunta</h1>
        </div>
<p className="panel-vacio">
          Todavía no hay categorías. Creá al menos una categoría en la sección
          &ldquo;Preguntas frecuentes&rdquo; del panel antes de cargar preguntas.
        </p>
      </PanelShell>
    );
  }

  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Nueva pregunta frecuente</h1>
      <p className="panel-lead">
        La pregunta y su respuesta son obligatorias. Se publica de inmediato en
        el sitio.
      </p>
      <PreguntaForm categorias={categorias} />
    </PanelShell>
  );
}