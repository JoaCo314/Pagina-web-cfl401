// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import { obtenerSeccionesPanel } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import MisDatosForm from "@/components/auth/MisDatosForm";

export const dynamic = "force-dynamic";

/// Datos de contacto de la cuenta propia: el usuario puede actualizar su email
/// y su teléfono. No puede cambiar su nombre, apellido ni DNI (eso lo gestiona
/// el panel).
export default async function MisDatosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  exigirContrasenaActualizada(user);

  const datos = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { email: true, telefono: true },
  });

  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Mis datos</h1>
      <p className="panel-lead">
        Actualizá tu email y tu teléfono de contacto. Tu nombre, apellido y DNI
        los administra el personal del centro.
      </p>
      <MisDatosForm
        inicial={{
          email: datos?.email ?? user.email,
          telefono: datos?.telefono ?? "",
        }}
      />
    </PanelShell>
  );
}
