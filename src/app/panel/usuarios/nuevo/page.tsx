import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { rolesQuePuedeCrear } from "@/lib/usuariosAdmin";
import PanelShell from "@/components/auth/PanelShell";
import UsuarioForm from "@/components/panel/UsuarioForm";

export const dynamic = "force-dynamic";

export default async function NuevoUsuarioPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.USUARIOS_CREAR)) {
    redirect("/panel/usuarios");
  }

  const rolesPermitidos = rolesQuePuedeCrear(user);
  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Nuevo usuario</h1>
      <p className="panel-lead">
        Creá una cuenta para el equipo. Según tu rol podés habilitar todas las
        opciones de rol o solo Docente. El nombre, el apellido, el email y la
        contraseña son obligatorios.
      </p>
      <UsuarioForm rolesPermitidos={rolesPermitidos} />
    </PanelShell>
  );
}