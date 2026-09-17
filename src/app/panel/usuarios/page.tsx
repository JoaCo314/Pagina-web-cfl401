import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import ToggleUsuario from "@/components/panel/ToggleUsuario";

export const dynamic = "force-dynamic";

export default async function UsuariosPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  // RF-15: el listado completo de usuarios es exclusivo de Administrador.
  if (!tienePermiso(user, PERMISOS.USUARIOS_VER_TODOS)) {
    if (tienePermiso(user, PERMISOS.USUARIOS_CREAR)) {
      redirect("/panel/usuarios/nuevo");
    }
    redirect("/panel");
  }

  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      activo: true,
      rol: { select: { nombre: true, nivel: true } },
    },
    orderBy: [{ rol: { nivel: "desc" } }, { apellido: "asc" }],
  });
  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Usuarios</h1>
          <p className="panel-lead">
            Listado completo de las cuentas del CFL 401. Podés dar de alta,
            desactivar o reactivar usuarios. Un usuario desactivado pierde el
            acceso al panel inmediatamente.
          </p>
        </div>
        <Link href="/panel/usuarios/nuevo" className="btn-primary btn-sm">
          + Nuevo usuario
        </Link>
      </div>

      {usuarios.length === 0 ? (
        <p className="panel-vacio">
          Todavía no hay usuarios cargados. Creá el primero desde “Nuevo
          usuario”.
        </p>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
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
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Rol">{u.rol.nombre}</td>
                  <td data-label="Estado">
                    <span
                      className={`badge-estado ${u.activo ? "ok" : "off"}`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td data-label="">
                    <ToggleUsuario
                      usuarioId={u.id}
                      nombre={`${u.nombre} ${u.apellido}`}
                      activo={u.activo}
                      esPropio={u.id === user.id}
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