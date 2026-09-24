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

  return (
    <SiteHeaderCliente
      active={active}
      sesionIniciada={user !== null}
      logoUrl={config?.logoUrl ?? "/cfl401azul_logo.jpg"}
      logoAlt={config?.logoAlt ?? "CFL 401 Azul"}
    />
  );
}