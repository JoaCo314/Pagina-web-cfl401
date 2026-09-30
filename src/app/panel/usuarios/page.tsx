import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import {
  alcanceUsuarios,
  filtroUsuariosVisibles,
  obtenerSeccionesPanel,
} from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import ToggleUsuario from "@/components/panel/ToggleUsuario";
import BlanquearContrasena from "@/components/panel/BlanquearContrasena";

export const dynamic = "force-dynamic";

export default async function UsuariosPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  exigirContrasenaActualizada(user);

  // RF-15: el Administrador gestiona todas las cuentas y el Preceptor solo las
  // de rol Docente. Un Docente no tiene alcance: lo devuelvo al panel.
  const alcance = alcanceUsuarios(user);
  if (alcance === "ninguno") {
    redirect("/panel");
  }

  const usuarios = await prisma.usuario.findMany({
    where: filtroUsuariosVisibles(user),
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      email: true,
      activo: true,
      debeCambiarContrasena: true,
      rol: { select: { nombre: true, nivel: true } },
    },
    orderBy: [{ rol: { nivel: "desc" } }, { apellido: "asc" }],
  });
  const secciones = obtenerSeccionesPanel(user);
  const soloDocentes = alcance === "docentes";

  return (
    <PanelShell user={user} secciones={secciones}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">
            {soloDocentes ? "Docentes" : "Usuarios"}
          </h1>
          <p className="panel-lead">
            {soloDocentes
              ? "Listado de las cuentas con rol Docente del CFL 401. Podés dar de alta cuentas, corregir el DNI, blanquear la contraseña y desactivar o reactivar docentes. Las cuentas de administradores y preceptores las administra el administrador del centro."
              : "Listado completo de las cuentas del CFL 401. Podés dar de alta, desactivar o reactivar usuarios y blanquear la contraseña de cada cuenta. El blanqueo siempre genera la contraseña temporal con los últimos 4 dígitos del DNI y la persona tiene que cambiarla al ingresar. Un usuario desactivado pierde el acceso al panel inmediatamente."}
          </p>
        </div>
        <Link href="/panel/usuarios/nuevo" className="btn-primary btn-sm">
          + Nuevo usuario
        </Link>
      </div>

      {usuarios.length === 0 ? (
        <p className="panel-vacio">
          Todavía no hay {soloDocentes ? "docentes" : "usuarios"} cargados. Creá
          el primero desde “Nuevo usuario”.
        </p>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Email</th>
                {!soloDocentes && <th>Rol</th>}
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td data-label="Nombre">
                    <strong>
                      {u.nombre} {u.apellido}
                    </strong>
                  </td>
                  <td data-label="DNI">{u.dni}</td>
                  <td data-label="Email">{u.email}</td>
                  {!soloDocentes && <td data-label="Rol">{u.rol.nombre}</td>}
                  <td data-label="Estado">
                    <span
                      className={`badge-estado ${u.activo ? "ok" : "off"}`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                    {u.debeCambiarContrasena && u.activo && (
                      <span className="badge-estado pendiente">
                        Contraseña temporal
                      </span>
                    )}
                  </td>
                  <td data-label="">
                    <ToggleUsuario
                      usuarioId={u.id}
                      nombre={`${u.nombre} ${u.apellido}`}
                      activo={u.activo}
                      esPropio={u.id === user.id}
                    />
                    <BlanquearContrasena
                      usuarioId={u.id}
                      nombre={`${u.nombre} ${u.apellido}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelShell>
  );
}