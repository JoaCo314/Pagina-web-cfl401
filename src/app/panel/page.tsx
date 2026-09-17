import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { obtenerSeccionesPanel } from "@/lib/auth/autorizacion";
import { ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  const secciones = obtenerSeccionesPanel(user);

  const misCursos =
    user.rol.nombre === ROLES.DOCENTE
      ? await prisma.curso.findMany({
          where: { docentes: { some: { docenteId: user.id } }, activo: true },
          select: { id: true, nombre: true, horarios: true },
          orderBy: [{ nombre: "asc" }],
        })
      : null;

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Hola, {user.nombre}</h1>
      <p className="panel-lead">
        {user.rol.nombre === ROLES.DOCENTE
          ? "Desde acá vas a gestionar los cursos que te fueron asignados: podés editarlos, pero no eliminar tus cursos ni modificar la asignación de docentes. No tenés acceso a los cursos de otros docentes ni a las secciones administrativas."
          : "Desde acá vas a administrar los cursos, los usuarios y la guía de inscripción de la plataforma."}
      </p>

      <section className="panel-cards">
        {secciones.map((seccion) =>
          seccion.clave === "mis_cursos" && misCursos ? (
            <article className="panel-card panel-card-wide" key={seccion.clave}>
              <h2>Mis cursos ({misCursos.length})</h2>
              <p>Estos son los cursos que te fueron asignados para gestionar:</p>
              {misCursos.length > 0 ? (
                <ul className="panel-lista">
                  {misCursos.map((c) => (
                    <li key={c.id}>
                      <div className="curso-info">
                        <strong>{c.nombre}</strong>
                        <span>{c.horarios ?? "Sin horario definido"}</span>
                      </div>
                      <Link
                        href={`/panel/cursos/${c.id}/editar`}
                        className="link-accion"
                      >
                        Editar
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="panel-vacio">
                  Todavía no tenés cursos asignados. Un administrador o
                  preceptor deberá asignártelos.
                </p>
              )}
            </article>
          ) : seccion.clave === "cursos" ? (
            <div className="panel-card" key={seccion.clave}>
              <h2>Cursos</h2>
              <p>Alta, edición, eliminación y asignación de docentes.</p>
            </div>
          ) : seccion.clave === "usuarios" ? (
            <div className="panel-card" key={seccion.clave}>
              <h2>Usuarios</h2>
              <p>Creación, listado y baja de cuentas del equipo.</p>
            </div>
          ) : seccion.clave === "guia" ? (
            <div className="panel-card" key={seccion.clave}>
              <h2>Guía de inscripción</h2>
              <p>Edición del contenido público de la guía.</p>
            </div>
          ) : (
            <div className="panel-card" key={seccion.clave}>
              <h2>{seccion.titulo}</h2>
              <p>{seccion.descripcion}</p>
            </div>
          )
        )}
      </section>
    </PanelShell>
  );
}