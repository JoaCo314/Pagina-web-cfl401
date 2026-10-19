// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { obtenerCategoriasCursosPanel } from "@/lib/categoriasCursos";
import PanelShell from "@/components/auth/PanelShell";
import CategoriasCursos from "@/components/panel/CategoriasCursos";

export const dynamic = "force-dynamic";

export default async function CategoriasCursosPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  exigirContrasenaActualizada(user);
  if (!tienePermiso(user, PERMISOS.CURSOS_CATEGORIAS)) {
    redirect("/panel");
  }

  const categorias = await obtenerCategoriasCursosPanel();
  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Categorías de cursos</h1>
          <p className="panel-lead">
            Administrá los rubros que agrupan la oferta educativa. El formulario
            de cada curso los ofrece en un selector. Desactivar una categoría no
            da de baja los cursos que ya la usan.
          </p>
        </div>
      </div>

      <CategoriasCursos categorias={categorias} />
    </PanelShell>
  );
}
