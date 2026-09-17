import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import { NOTICIA_SELECT } from "@/lib/noticiaAdmin";
import { formatearFecha } from "@/lib/cursoUtils";
import PanelShell from "@/components/auth/PanelShell";
import EliminarNoticia from "@/components/panel/EliminarNoticia";

export const dynamic = "force-dynamic";

export default async function NoticiasPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.NOTICIAS_CREAR)) {
    redirect("/panel");
  }

  const noticias = await prisma.noticia.findMany({
    select: NOTICIA_SELECT,
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
  });
  const secciones = obtenerSeccionesPanel(user);
  const puedeEliminar = tienePermiso(user, PERMISOS.NOTICIAS_ELIMINAR);

  return (
    <PanelShell user={user} secciones={secciones}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Noticias</h1>
          <p className="panel-lead">
            Publicación y edición de las novedades institucionales. Los cambios
            se publican en el sitio al instante.
          </p>
        </div>
        <Link href="/panel/noticias/nuevo" className="btn-primary btn-sm">
          + Nueva noticia
        </Link>
      </div>

      {noticias.length === 0 ? (
        <p className="panel-vacio">
          Todavía no hay noticias cargadas. Publicá la primera desde “Nueva
          noticia”.
        </p>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Noticia</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {noticias.map((noticia) => (
                <tr key={noticia.id}>
                  <td data-label="Noticia">
                    <strong>{noticia.titulo}</strong>
                    {noticia.resumen && (
                      <small className="td-sub">{noticia.resumen}</small>
                    )}
                  </td>
                  <td data-label="Fecha">
                    {formatearFecha(noticia.fecha.toISOString())}
                  </td>
                  <td data-label="Estado">
                    <span
                      className={`badge-estado ${
                        noticia.activo ? "ok" : "off"
                      }`}
                    >
                      {noticia.activo ? "Publicada" : "Inactiva"}
                    </span>
                  </td>
                  <td data-label="">
                    <div className="acciones-curso">
                      <Link
                        href={`/panel/noticias/${noticia.id}/editar`}
                        className="link-accion"
                      >
                        Editar
                      </Link>
                      {puedeEliminar && (
                        <EliminarNoticia
                          noticiaId={noticia.id}
                          titulo={noticia.titulo}
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
