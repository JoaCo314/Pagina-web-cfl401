import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";

export const dynamic = "force-dynamic";

export default async function UsuariosPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.USUARIOS_VER)) {
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
  const puedeCrear = tienePermiso(user, PERMISOS.USUARIOS_CREAR);

  return (
    <PanelShell user={user} secciones={secciones}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Usuarios</h1>
          <p className="panel-lead">
            Cuentas del equipo del CFL 401. Desde acá podés dar de alta a
            preceptores y docentes según tu rol.
          </p>
        </div>
        {puedeCrear && (
          <Link href="/panel/usuarios/nuevo" className="btn-primary btn-sm">
            + Nuevo usuario
          </Link>
        )}
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
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>
                      {u.nombre} {u.apellido}
                    </strong>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.rol.nombre}</td>
                  <td>
                    <span
                      className={`badge-estado ${u.activo ? "ok" : "off"}`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
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