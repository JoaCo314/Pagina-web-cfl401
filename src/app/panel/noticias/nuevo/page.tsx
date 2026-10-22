// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import PanelShell from "@/components/auth/PanelShell";
import NoticiaForm from "@/components/panel/NoticiaForm";

export const dynamic = "force-dynamic";

export default async function NuevaNoticiaPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  exigirContrasenaActualizada(user);
  if (!tienePermiso(user, PERMISOS.NOTICIAS_CREAR)) {
    redirect("/panel");
  }

  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Nueva noticia</h1>
      <p className="panel-lead">
        El título y el contenido son obligatorios. Podés publicarla de inmediato
        o guardarla como borrador para terminarla más tarde.
      </p>
      <NoticiaForm />
    </PanelShell>
  );
}
