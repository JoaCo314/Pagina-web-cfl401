import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import { CURSO_SELECT } from "@/lib/cursoAdmin";
import { formatearFecha } from "@/lib/cursoUtils";
import PanelShell from "@/components/auth/PanelShell";
import EliminarCurso from "@/components/panel/EliminarCurso";

export const dynamic = "force-dynamic";

export default async function CursosPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; estado?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  exigirContrasenaActualizada(user);
  if (!tienePermiso(user, PERMISOS.CURSOS_CREAR)) {
    redirect("/panel");
  }

  const { q, categoria, estado } = await searchParams;
  const busqueda = (q ?? "").trim();
  const categoriaId = categoria ? Number(categoria) : undefined;

  const categorias = await prisma.categoriaCurso.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  const donde = {
    ...(busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda, mode: "insensitive" as const } },
            {
              docentes: {
                some: {
                  docente: {
                    OR: [
                      {
                        nombre: {
                          contains: busqueda,
                          mode: "insensitive" as const,
                        },
                      },
                      {
                        apellido: {
                          contains: busqueda,
                          mode: "insensitive" as const,
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        }
      : {}),
    ...(categoriaId && !isNaN(categoriaId) ? { categoriaId } : {}),
    ...(estado === "activos"
      ? { activo: true }
      : estado === "inactivos"
        ? { activo: false }
        : {}),
  };

  const cursos = await prisma.curso.findMany({
    where: donde,
    select: CURSO_SELECT,
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });
  const secciones = obtenerSeccionesPanel(user);
  const puedeEliminar = tienePermiso(user, PERMISOS.CURSOS_ELIMINAR);
  const hayFiltro = Boolean(busqueda || categoria || estado);

  return (
    <PanelShell user={user} secciones={secciones}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Cursos</h1>
          <p className="panel-lead">
            Alta y edición de la oferta educativa. Los cambios se publican en el
            sitio público al instante.
          </p>
        </div>
        <Link href="/panel/cursos/nuevo" className="btn-primary btn-sm">
          + Nuevo curso
        </Link>
      </div>

      <form
        method="get"
        action="/panel/cursos"
        role="search"
        className="filtros-auditoria mb-4"
      >
        <label className="filtro-buscar">
          <span className="sr-only">Buscar por nombre o docente</span>
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            maxLength={100}
            placeholder="Buscar curso o docente…"
          />
        </label>

        <label className="filtro-seccion">
          <span className="sr-only">Filtrar por categoría</span>
          <select name="categoria" defaultValue={categoria ?? ""}>
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="filtro-rol">
          <span className="sr-only">Filtrar por estado</span>
          <select name="estado" defaultValue={estado ?? ""}>
            <option value="">Todos los estados</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
        </label>

        <button type="submit" className="btn-primary btn-sm">
          Aplicar
        </button>
        {hayFiltro && (
          <Link href="/panel/cursos" className="btn-ghost-dark btn-sm">
            Limpiar
          </Link>
        )}
      </form>

      {cursos.length === 0 ? (
        <p className="panel-vacio">
          {hayFiltro
            ? "No se encontraron cursos con los filtros seleccionados."
            : "Todavía no hay cursos cargados. Creá el primero desde “Nuevo curso”."}
        </p>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Categoría</th>
                <th>Modalidad</th>
                <th>Docentes</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((curso) => (
                <tr key={curso.id}>
                  <td data-label="Curso">
                    <strong>{curso.nombre}</strong>
                    <small className="td-sub">
                      Inicio: {formatearFecha(curso.fechaInicio)}
                      {curso.horarios ? ` · ${curso.horarios}` : ""}
                    </small>
                  </td>
                  <td data-label="Categoría">{curso.categoria?.nombre ?? "—"}</td>
                  <td data-label="Modalidad">
                    {curso.modalidad ? (
                      <span className="chip-modalidad">{curso.modalidad}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td data-label="Docentes">
                    {curso.docentes.length > 0 ? (
                      curso.docentes
                        .map(
                          (d) => `${d.docente.nombre} ${d.docente.apellido}`
                        )
                        .join(", ")
                    ) : (
                      <span className="docente-sin-asignar">
                        A definir
                      </span>
                    )}
                  </td>
                  <td data-label="Estado">
                    <span
                      className={`badge-estado ${
                        curso.activo ? "ok" : "off"
                      }`}
                    >
                      {curso.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td data-label="">
                    <div className="acciones-curso">
                      <Link
                        href={`/panel/cursos/${curso.id}/editar`}
                        className="link-accion"
                      >
                        Editar
                      </Link>
                      {puedeEliminar && (
                        <EliminarCurso
                          cursoId={curso.id}
                          nombre={curso.nombre}
                          cantidadDocentes={curso.docentes.length}
                        />
                      )}
                    </div>
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