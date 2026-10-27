import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { obtenerCategoriasPanel } from "@/lib/preguntasFrecuentes";
import PanelShell from "@/components/auth/PanelShell";
import CategoriasPreguntas from "@/components/panel/CategoriasPreguntas";

export const dynamic = "force-dynamic";

export default async function PreguntasFaqsPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  exigirContrasenaActualizada(user);
  if (!tienePermiso(user, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    redirect("/panel");
  }

  const categorias = await obtenerCategoriasPanel();
  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Preguntas frecuentes</h1>
          <p className="panel-lead">
            Administrá las categorías y las preguntas de la página pública. Las
            preguntas inactivas o las categorías sin preguntas activas no se
            muestran en el sitio.
          </p>
        </div>
        <Link href="/panel/preguntas-frecuentes/nueva" className="btn-primary btn-sm">
          + Nueva pregunta
        </Link>
      </div>

      <CategoriasPreguntas categorias={categorias} />
    </PanelShell>
  );
}
