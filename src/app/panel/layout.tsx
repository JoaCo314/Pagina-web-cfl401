import type { ReactNode } from "react";
import type { Metadata } from "next";

// El panel es administrativo: no debe indexarse ni seguirse por los motores de
// búsqueda. Un solo layout define el noindex para todas sus páginas.
export const metadata: Metadata = {
  title: { default: "Panel — CFL 401 Azul", template: "%s — Panel CFL 401 Azul" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}