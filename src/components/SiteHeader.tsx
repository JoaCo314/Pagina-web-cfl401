import { getCurrentUser } from "@/lib/auth/session";
import { getSiteConfig } from "@/lib/siteConfig";
import SiteHeaderCliente from "./SiteHeaderCliente";

type SiteHeaderProps = {
  active?: string;
};

// Creado por sofia-athos: logo editable desde panel/configuracion
export default async function SiteHeader({ active }: SiteHeaderProps) {
  const user = await getCurrentUser();
  const config = await getSiteConfig().catch(() => null);

  const logoAlt =
    config?.logoAlt && config.logoAlt.trim() !== "" && config.logoAlt !== "CFL 401 Azul"
      ? config.logoAlt
      : "Logo institucional CFL 401 Azul — Centro de Formación Laboral";

  return (
    <SiteHeaderCliente
      active={active}
      sesionIniciada={user !== null}
      logoUrl={config?.logoUrl ?? "/cfl401azul_logo.jpg"}
      logoAlt={logoAlt}
      telefono={config?.contactoTelefono ?? null}
    />
  );
}
