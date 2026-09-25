import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { getSiteConfig } from "@/lib/siteConfig";
import PanelShell from "@/components/auth/PanelShell";
import ContactoForm from "@/components/panel/ContactoForm";

export const dynamic = "force-dynamic";

export default async function ContactoPanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/panel/login");
  if (!tienePermiso(user, PERMISOS.SITE_CONFIG_EDITAR)) redirect("/panel");

  const config = await getSiteConfig();

  return (
    <PanelShell user={user} secciones={obtenerSeccionesPanel(user)}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Contacto</h1>
          <p className="panel-lead">
            Datos que se muestran en la página /contacto. La dirección también
            es el destino del botón &quot;Cómo llegar&quot; del mapa de la
            portada.
          </p>
        </div>
      </div>
      <ContactoForm inicial={config} />
    </PanelShell>
  );
}