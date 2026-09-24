import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import {
  SOBRE_SELECT,
  leerEstadisticas,
  leerGaleria,
  leerHitos,
} from "@/lib/sobreElCentro";
import PanelShell from "@/components/auth/PanelShell";
import SobreElCentroForm from "@/components/panel/SobreElCentroForm";

export const dynamic = "force-dynamic";

export default async function SobreElCentroPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.SOBRE_EL_CENTRO_EDITAR)) {
    redirect("/panel");
  }

  const sobre = await prisma.sobreElCentro.findFirst({
    select: SOBRE_SELECT,
    orderBy: { id: "asc" },
  });

  return (
    <PanelShell user={user} secciones={obtenerSeccionesPanel(user)}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Sobre el Centro</h1>
          <p className="panel-lead">
            Editá la página institucional del sitio. Todo es opcional: las
            secciones que queden vacías no se muestran en la vista pública.
          </p>
        </div>
      </div>

      <SobreElCentroForm
        inicial={{
          intro: sobre?.intro ?? "",
          introHtml: sobre?.introHtml ?? "",
          misionTitulo: sobre?.misionTitulo ?? "",
          misionTexto: sobre?.misionTexto ?? "",
          misionTextoHtml: sobre?.misionTextoHtml ?? "",
          historiaTitulo: sobre?.historiaTitulo ?? "",
          historiaTexto: sobre?.historiaTexto ?? "",
          historiaTextoHtml: sobre?.historiaTextoHtml ?? "",
          hitos: leerHitos(sobre?.hitos ?? null) ?? [],
          estadisticasTitulo: sobre?.estadisticasTitulo ?? "",
          estadisticas: leerEstadisticas(sobre?.estadisticas ?? null) ?? [],
          galeriaTitulo: sobre?.galeriaTitulo ?? "",
          galeria: leerGaleria(sobre?.galeria ?? null) ?? [],
          activo: sobre?.activo ?? true,
        }}
      />
    </PanelShell>
  );
}