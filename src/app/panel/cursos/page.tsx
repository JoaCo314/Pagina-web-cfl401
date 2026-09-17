import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import { CURSO_SELECT } from "@/lib/cursoAdmin";
import PanelShell from "@/components/auth/PanelShell";
import EliminarCurso from "@/components/panel/EliminarCurso";

export const dynamic = "force-dynamic";

export default async function CursosPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.CURSOS_CREAR)) {
    redirect("/panel");
  }

  const cursos = await prisma.curso.findMany({
    select: CURSO_SELECT,
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });
  const secciones = obtenerSeccionesPanel(user);
  const puedeEliminar = tienePermiso(user, PERMISOS.CURSOS_ELIMINAR);

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

      {cursos.length === 0 ? (
        <p className="panel-vacio">
          Todavía no hay cursos cargados. Creá el primero desde “Nuevo curso”.
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
                      Inicio:{" "}
                      {curso.fechaInicio
                        ? new Date(curso.fechaInicio).toLocaleDateString(
                            "es-AR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )
                        : "A confirmar"}
                      {curso.horarios ? ` · ${curso.horarios}` : ""}
                    </small>
                  </td>
                  <td data-label="Categoría">{curso.categoria ?? "—"}</td>
                  <td data-label="Modalidad">{curso.modalidad ?? "—"}</td>
                  <td data-label="Docentes">
                    {curso.docentes.length > 0
                      ? curso.docentes
                          .map(
                            (d) => `${d.docente.nombre} ${d.docente.apellido}`
                          )
                          .join(", ")
                      : "A definir"}
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