import { getCurrentUser } from "@/lib/auth/session";
import SiteHeaderCliente from "./SiteHeaderCliente";

type SiteHeaderProps = {
  active?: string;
};

export default async function SiteHeader({ active }: SiteHeaderProps) {
  const user = await getCurrentUser();

  return <SiteHeaderCliente active={active} sesionIniciada={user !== null} />;
}