import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { obtenerSeccionesPanel } from "@/lib/auth/autorizacion";
import PanelShell from "@/components/auth/PanelShell";

export const dynamic = "force-dynamic";

// El panel es administrativo: no debe indexarse ni seguirse por los motores de
// búsqueda. El layout persistente mantiene el sidebar montado y fluido entre navegaciones.
export const metadata: Metadata = {
  title: { default: "Panel — CFL 401 Azul", template: "%s — Panel CFL 401 Azul" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    return <>{children}</>;
  }

  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      {children}
    </PanelShell>
  );
}
