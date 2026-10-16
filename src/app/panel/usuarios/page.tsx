// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import {
  alcanceUsuarios,
  filtroUsuariosVisibles,
  obtenerSeccionesPanel,
  PERMISOS,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import ToggleUsuario from "@/components/panel/ToggleUsuario";
import BlanquearContrasena from "@/components/panel/BlanquearContrasena";
import EliminarUsuario from "@/components/panel/EliminarUsuario";
import EditarDniUsuario from "@/components/panel/EditarDniUsuario";
import NavPaginacion from "@/components/panel/NavPaginacion";

export const dynamic = "force-dynamic";

const CANTIDAD_POR_PAGINA = 25;

function paginaValida(valor: string | undefined, totalPaginas: number): number {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1) return 1;
  return Math.min(numero, totalPaginas);
}

export default async function UsuariosPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
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

  const { pagina: paginaParam } = await searchParams;
  const donde = filtroUsuariosVisibles(user);
  const totalUsuarios = await prisma.usuario.count({ where: donde });
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalUsuarios / CANTIDAD_POR_PAGINA)
  );
  const pagina = paginaValida(paginaParam, totalPaginas);

  const usuarios = await prisma.usuario.findMany({
    where: donde,
    select: {
      id: true,
      nombre: true,
      apellido: true,
      dni: true,
      email: true,
      telefono: true,
      activo: true,
      bloqueada: true,
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
    skip: (pagina - 1) * CANTIDAD_POR_PAGINA,
    take: CANTIDAD_POR_PAGINA,
  });
  const secciones = obtenerSeccionesPanel(user);
  const soloDocentes = alcance === "docentes";
  const puedeEliminar = tienePermiso(user, PERMISOS.USUARIOS_ELIMINAR);
  const construirHref = (p: number) =>
    p <= 1 ? "/panel/usuarios" : `/panel/usuarios?pagina=${p}`;

  return (
    <PanelShell user={user} secciones={secciones}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">
            {soloDocentes ? "Docentes" : "Usuarios"}
          </h1>
          <p className="panel-lead">
            {soloDocentes
              ? "Cuentas con rol Docente del CFL 401: se pueden dar de alta, editar el DNI, blanquear la contraseña y activar o desactivar."
              : "Todas las cuentas del CFL 401: alta, edición de DNI, blanqueo de contraseña y activación o desactivación de usuarios."}
          </p>
          {/* El detalle largo (password temporal, recálculo al corregir el DNI,
              efectos de la baja) iba en el lead como párrafos sueltos y quedaba
              como un muro de texto arriba de la tabla. Ahora está colapsado. */}
          <details className="panel-lead-detalle">
            <summary>¿Cómo funcionan las contraseñas, los bloqueos y los permisos?</summary>
            <p>
              {soloDocentes
                ? "Las cuentas de administradores y preceptores las administra el administrador del centro: acá solo aparecen los docentes."
                : "El blanqueo siempre genera la contraseña temporal con los últimos 4 dígitos del DNI y la persona tiene que cambiarla al ingresar. Si corregís el DNI de una cuenta que todavía tiene la contraseña temporal, la temporal se vuelve a calcular con el DNI nuevo. Un usuario desactivado pierde el acceso al panel inmediatamente."}
            </p>
            <p>
              Si alguien falla la contraseña 5 veces seguidas, la cuenta se
              bloquea sola y aparece con la etiqueta «Bloqueada». Para que esa
              persona vuelva a entrar hay que reactivarla con el botón «Activar»:
              al hacerlo también se levanta el bloqueo.
            </p>
            {puedeEliminar && (
              <p>
                Una cuenta inactiva se puede dar de baja definitiva con el botón
                «Eliminar». Es irreversible y no se puede eliminar una cuenta que
                todavía tenga cursos asignados.
              </p>
            )}
            <p>
              El teléfono de contacto lo carga cada persona desde su propia
              cuenta («Mis datos», en la cabecera del panel). Acá aparece solo
              para poder comunicarse con la persona; no se publica en el sitio.
            </p>
          </details>
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
                ? "Docentes del centro, con su DNI, teléfono, estado y acciones"
                : "Usuarios del centro, con su DNI, teléfono, rol, estado y acciones"}
            </caption>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">DNI</th>
                <th scope="col">Email</th>
                <th scope="col">Teléfono</th>
                {!soloDocentes && <th scope="col">Rol</th>}
                <th scope="col">Estado</th>
                {/* Título visible en escritorio (antes era sr-only y la columna
                    quedaba sin encabezado); en modo tarjeta el thead no se ve,
                    así que ahí manda el data-label "Acciones" de la celda. */}
                <th scope="col">Acciones</th>
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
                    {/* El teléfono lo carga cada persona desde su propia cuenta
                        ("Mis datos") y acá se muestra solo al personal del
                        centro: nunca se publica en el sitio. */}
                    <td data-label="Teléfono">
                      {u.telefono || (
                        <span className="td-vacio" title="Sin teléfono cargado">
                          —
                        </span>
                      )}
                    </td>
                    {!soloDocentes && <td data-label="Rol">{u.rol.nombre}</td>}
                    <td data-label="Estado">
                      <span
                        className={`badge-estado ${u.activo ? "ok" : "off"}`}
                      >
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                      {u.bloqueada && (
                        <span
                          className="badge-estado bloqueada"
                          title="Se bloqueó sola tras demasiados intentos fallidos de inicio de sesión. Reactivá la cuenta para desbloquearla."
                        >
                          Bloqueada
                        </span>
                      )}
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
                      <span className="acciones-usuario">
                        <Link
                          href={`/panel/usuarios/${u.id}/editar`}
                          className="link-accion"
                        >
                          Editar datos
                        </Link>
                      </span>
                      <ToggleUsuario
                        usuarioId={u.id}
                        nombre={nombre}
                        activo={u.activo}
                        bloqueada={u.bloqueada}
                        esPropio={esPropio}
                        cursosAsignados={u._count.cursosAsignados}
                      />
                      <BlanquearContrasena
                        usuarioId={u.id}
                        nombre={nombre}
                        esPropio={esPropio}
                      />
                      {!u.activo && !esPropio && puedeEliminar && (
                        <EliminarUsuario
                          usuarioId={u.id}
                          nombre={nombre}
                          cursosAsignados={u._count.cursosAsignados}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <NavPaginacion
        pagina={pagina}
        totalPaginas={totalPaginas}
        construirHref={construirHref}
        etiqueta={soloDocentes ? "Paginación de docentes" : "Paginación de usuarios"}
      />
    </PanelShell>
  );
}