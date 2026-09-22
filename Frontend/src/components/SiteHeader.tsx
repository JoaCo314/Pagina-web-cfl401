import SiteHeaderCliente from "./SiteHeaderCliente";

type SiteHeaderProps = {
  active?: string;
};

export default function SiteHeader({ active }: SiteHeaderProps) {
  return <SiteHeaderCliente active={active} sesionIniciada={false} />;
}
