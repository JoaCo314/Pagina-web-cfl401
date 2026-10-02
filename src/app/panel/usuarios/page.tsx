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
import EditarDniUsuario from "@/components/panel/EditarDniUsuario";

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
      // Para poder avisar cuántos cursos quedan colgados si se desactiva una
      // cuenta: el docente sigue asignado aunque no pueda iniciar sesión.
      _count: { select: { cursosAsignados: true } },
    },
    // `apellido` y `nombre` tienen el mismo nivel de jerarquía en el orden, así
    // que Prisma puede indistinguirlos: el desempate por id hace el orden
    // estable y evita que dos filas con el mismo apellido salten de lugar.
    orderBy: [{ rol: { nivel: "desc" } }, { apellido: "asc" }, { nombre: "asc" }, { id: "asc" }],
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
              : "Listado completo de las cuentas del CFL 401. Podés dar de alta, desactivar o reactivar usuarios y blanquear la contraseña de cada cuenta. El blanqueo siempre genera la contraseña temporal con los últimos 4 dígitos del DNI y la persona tiene que cambiarla al ingresar. Si corregís el DNI de una cuenta que todavía tiene la contraseña temporal, la temporal se vuelve a calcular con el DNI nuevo. Un usuario desactivado pierde el acceso al panel inmediatamente."}
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
            <caption className="sr-only">
              {soloDocentes
                ? "Docentes del centro, con su DNI, estado y acciones"
                : "Usuarios del centro, con su DNI, rol, estado y acciones"}
            </caption>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">DNI</th>
                <th scope="col">Email</th>
                {!soloDocentes && <th scope="col">Rol</th>}
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const nombre = `${u.nombre} ${u.apellido}`;
                const esPropio = u.id === user.id;
                return (
                  <tr key={u.id}>
                    <th scope="row" data-label="Nombre" className="celda-principal">
                      <strong>
                        {nombre}
                        {esPropio && <span className="td-sub"> (vos)</span>}
                      </strong>
                    </th>
                    <td data-label="DNI">
                      <EditarDniUsuario
                        usuarioId={u.id}
                        nombre={nombre}
                        dni={u.dni}
                        tieneTemporal={u.debeCambiarContrasena}
                      />
                    </td>
                    <td data-label="Email">{u.email}</td>
                    {!soloDocentes && <td data-label="Rol">{u.rol.nombre}</td>}
                    <td data-label="Estado">
                      <span
                        className={`badge-estado ${u.activo ? "ok" : "off"}`}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                      {u.debeCambiarContrasena && (
                        <span
                          className="badge-estado pendiente"
                          title={
                            u.activo
                              ? "Todavía tiene que cambiar la contraseña temporal"
                              : "La cuenta está inactiva y además tiene pendiente el cambio de contraseña"
                          }
                        >
                          Contraseña temporal
                        </span>
                      )}
                    </td>
                    <td data-label="Acciones" className="celda-acciones">
                      <ToggleUsuario
                        usuarioId={u.id}
                        nombre={nombre}
                        activo={u.activo}
                        esPropio={esPropio}
                        cursosAsignados={u._count.cursosAsignados}
                      />
                      <BlanquearContrasena
                        usuarioId={u.id}
                        nombre={nombre}
                        esPropio={esPropio}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PanelShell>
  );
}