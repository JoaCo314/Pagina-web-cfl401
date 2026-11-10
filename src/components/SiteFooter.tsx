import { getSiteConfig } from "@/lib/siteConfig";
import SiteFooterCliente from "./SiteFooterCliente";

// Creado por sofia-athos: footer editable desde panel/configuracion
export default async function SiteFooter() {
  const config = await getSiteConfig().catch(() => null);

  return (
    <SiteFooterCliente
      footerCflTitulo={config?.footerCflTitulo}
      footerCflTexto={config?.footerCflTexto}
      footerContactosTitulo={config?.footerContactosTitulo}
      footerEmail={config?.footerEmail}
      footerTelefono={config?.footerTelefono}
      footerDireccion={config?.footerDireccion}
      footerHorarios={config?.footerHorarios}
      footerCopy={config?.footerCopy}
    />
  );
}
