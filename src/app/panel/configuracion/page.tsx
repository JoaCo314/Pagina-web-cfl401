import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { getSiteConfig } from "@/lib/siteConfig";
import PanelShell from "@/components/auth/PanelShell";
import SiteConfigForm from "@/components/panel/SiteConfigForm";

export const dynamic = "force-dynamic";

// Creado por sofia-athos - Panel editable para banner azul, logo, footer y contactos
export default async function ConfiguracionPanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/panel/login");
  exigirContrasenaActualizada(user);
  if (!tienePermiso(user, PERMISOS.SITE_CONFIG_EDITAR)) redirect("/panel");

  const config = await getSiteConfig();

  return (
    <PanelShell user={user} secciones={obtenerSeccionesPanel(user)}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Configuración del sitio</h1>
          <p className="panel-lead">Editá el banner azul de la front page, el logo, el pie de página y el mapa de ubicación. Los datos de la página /contacto se editan en la sección Contacto.</p>
        </div>
      </div>
      <SiteConfigForm inicial={config} />
    </PanelShell>
  );
}
