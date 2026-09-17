import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import PanelShell from "@/components/auth/PanelShell";
import NoticiaForm from "@/components/panel/NoticiaForm";

export const dynamic = "force-dynamic";

export default async function NuevaNoticiaPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.NOTICIAS_CREAR)) {
    redirect("/panel");
  }

  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Nueva noticia</h1>
      <p className="panel-lead">
        El título y el contenido son obligatorios. La noticia se publica de
        inmediato en el sitio.
      </p>
      <NoticiaForm />
    </PanelShell>
  );
}
