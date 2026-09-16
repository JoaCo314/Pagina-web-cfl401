import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { obtenerDocentesActivos } from "@/lib/cursoAdmin";
import PanelShell from "@/components/auth/PanelShell";
import CursoForm from "@/components/panel/CursoForm";

export const dynamic = "force-dynamic";

export default async function NuevoCursoPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.CURSOS_CREAR)) {
    redirect("/panel");
  }

  const docentes = await obtenerDocentesActivos();
  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Nuevo curso</h1>
      <p className="panel-lead">
        Completá los datos del curso. El nombre es obligatorio; el resto puede
        editarse más adelante.
      </p>
      <CursoForm docentes={docentes} />
    </PanelShell>
  );
}