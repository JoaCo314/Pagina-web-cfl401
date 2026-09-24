import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { getSiteConfig } from "@/lib/siteConfig";
import PanelShell from "@/components/auth/PanelShell";
import SiteConfigForm from "@/components/panel/SiteConfigForm";

export const dynamic = "force-dynamic";

// Creado por sofia-athos - Panel editable para banner azul, logo, footer y contactos
export default async function ConfiguracionPanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/panel/login");
  if (!tienePermiso(user, PERMISOS.SITE_CONFIG_EDITAR)) redirect("/panel");

  const config = await getSiteConfig();

  return (
    <PanelShell user={user} secciones={obtenerSeccionesPanel(user)}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Configuración del sitio</h1>
          <p className="panel-lead">Editá el banner azul de la front page, el logo, el pie de página y la sección de contacto. Los cambios se reflejan al instante en el sitio público.</p>
        </div>
      </div>
      <SiteConfigForm inicial={config} />
    </PanelShell>
  );
}
