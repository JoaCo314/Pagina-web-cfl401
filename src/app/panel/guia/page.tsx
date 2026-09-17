import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import GuiaForm from "@/components/panel/GuiaForm";

export const dynamic = "force-dynamic";

export default async function GuiaPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  // RF-05: solo quienes tengan el permiso GUIA_EDITAR (Administrador y
  // Preceptor, según la matriz RNF-04) pueden editar la guía.
  if (!tienePermiso(user, PERMISOS.GUIA_EDITAR)) {
    redirect("/panel");
  }

  const contenidos = await prisma.contenidoGuia.findMany({
    where: { activo: true },
    select: { clave: true, titulo: true, contenido: true },
    orderBy: { orden: "asc" },
  });

  if (contenidos.length === 0) {
    return (
      <PanelShell user={user} secciones={obtenerSeccionesPanel(user)}>
        <div className="panel-head">
          <h1 className="panel-title">Guía de inscripción</h1>
        </div>
        <p className="panel-vacio">
          Todavía no hay bloques de contenido para la guía. Cargá el contenido
          inicial desde el seed de la base de datos.
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell user={user} secciones={obtenerSeccionesPanel(user)}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Guía de inscripción</h1>
          <p className="panel-lead">
            Editá el contenido de la guía pública de inscripción. Los cambios
            se reflejan de inmediato en la sección pública del sitio.
          </p>
        </div>
      </div>

      <GuiaForm bloques={contenidos} />
    </PanelShell>
  );
}