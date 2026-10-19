// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { notFound, redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import { puedeGestionarUsuario, obtenerSeccionesPanel } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import EditarUsuarioForm from "@/components/panel/EditarUsuarioForm";

export const dynamic = "force-dynamic";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuarioId = Number(id);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  exigirContrasenaActualizada(user);

  const existente = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      email: true,
      rol: { select: { nombre: true } },
    },
  });

  // Mismo criterio que la API: primero el alcance (para no revelar cuentas
  // fuera del alcance) y solo después la existencia.
  if (!puedeGestionarUsuario(user, existente)) {
    redirect("/panel");
  }

  if (!existente) {
    return notFound();
  }

  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Editar datos</h1>
      <p className="panel-lead">
        Modificá los datos de <strong>{existente.nombre} {existente.apellido}</strong>{" "}
        ({existente.rol.nombre}). El rol y la contraseña se gestionan por
        separado desde el listado.
      </p>
      <EditarUsuarioForm
        usuarioId={existente.id}
        inicial={{
          nombre: existente.nombre,
          apellido: existente.apellido,
          dni: existente.dni,
          email: existente.email,
        }}
      />
    </PanelShell>
  );
}
