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
      <CategoriasPreguntas categorias={categorias} />
    </PanelShell>
  );
}
