import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import {
  alcanceUsuarios,
  obtenerSeccionesPanel,
  PERMISOS,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { rolesQuePuedeCrear } from "@/lib/usuariosAdmin";
import PanelShell from "@/components/auth/PanelShell";
import UsuarioForm from "@/components/panel/UsuarioForm";

export const dynamic = "force-dynamic";

export default async function NuevoUsuarioPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  exigirContrasenaActualizada(user);
  if (!tienePermiso(user, PERMISOS.USUARIOS_CREAR)) {
    redirect("/panel/usuarios");
  }

  const rolesPermitidos = rolesQuePuedeCrear(user);
  const soloDocentes = alcanceUsuarios(user) === "docentes";
  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Nuevo usuario</h1>
      <p className="panel-lead">
        Creá una cuenta para el equipo. Según tu rol podés habilitar todas las
        opciones de rol o solo Docente. El nombre, el apellido, el DNI y el
        email son obligatorios. La contraseña inicial se genera sola con los
        últimos 4 dígitos del DNI y la persona la cambia al ingresar por
        primera vez.
      </p>
      {soloDocentes && (
        <p className="form-note">
          Solo podés crear cuentas con rol Docente. El listado que ves después
          está acotado a los docentes: las cuentas de administradores y
          preceptores las administra el administrador del centro.
        </p>
      )}
      <UsuarioForm rolesPermitidos={rolesPermitidos} puedeVerListado />
    </PanelShell>
  );
}