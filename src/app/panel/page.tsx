import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import PanelShell from "@/components/auth/PanelShell";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  return (
    <PanelShell user={user}>
      <h1 className="panel-title">Hola, {user.nombre}</h1>
      <p className="panel-lead">
        Desde acá vas a administrar los cursos, los usuarios y la guía de
        inscripción de la plataforma. Las secciones estarán disponibles en las
        próximas etapas.
      </p>

      <section className="panel-cards">
        <div className="panel-card">
          <h2>Cursos</h2>
          <p>Alta, edición, eliminación y asignación de docentes.</p>
        </div>
        <div className="panel-card">
          <h2>Usuarios</h2>
          <p>Creación, listado y baja de cuentas del equipo.</p>
        </div>
        <div className="panel-card">
          <h2>Guía de inscripción</h2>
          <p>Edición del contenido público de la guía.</p>
        </div>
      </section>
    </PanelShell>
  );
}