import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { obtenerCategoriasPanel } from "@/lib/preguntasFrecuentes";
import PanelShell from "@/components/auth/PanelShell";
import CategoriasPreguntas, {
  type CategoriaListable,
} from "@/components/panel/CategoriasPreguntas";
import EliminarPregunta from "@/components/panel/EliminarPregunta";

export const dynamic = "force-dynamic";

export default async function PreguntasFaqsPanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    redirect("/panel");
  }

  const categorias = await obtenerCategoriasPanel();
  const secciones = obtenerSeccionesPanel(user);

  const categoriasListables: CategoriaListable[] = categorias.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    orden: c.orden,
    activo: c.activo,
    _count: { preguntas: c.preguntas.length },
  }));

  return (
    <PanelShell user={user} secciones={secciones}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Preguntas frecuentes</h1>
          <p className="panel-lead">
            Administrá las categorías y las preguntas de la página pública. Las
            preguntas inactivas o las categorías sin preguntas activas no se
            muestran en el sitio.
          </p>
        </div>
        <Link href="/panel/preguntas-frecuentes/nueva" className="btn-primary btn-sm">
          + Nueva pregunta
        </Link>
      </div>

      <CategoriasPreguntas categorias={categoriasListables} />

      {categorias.length === 0 ? (
        <p className="panel-vacio">
          Todavía no hay categorías. Creá una categoría para poder cargar
          preguntas frecuentes.
        </p>
      ) : (
        <div className="faqs-panel-list">
          {categorias
            .filter((c) => c.preguntas.length > 0)
            .map((categoria) => (
              <div key={categoria.id} className="panel-box">
                <div className="panel-box-head">
                  <h2>{categoria.nombre}</h2>
                </div>
                <div className="panel-table-wrap">
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>Pregunta</th>
                        <th>Orden</th>
                        <th>Estado</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoria.preguntas.map((pregunta) => (
                        <tr key={pregunta.id}>
                          <td data-label="Pregunta">
                            <strong>{pregunta.pregunta}</strong>
                          </td>
                          <td data-label="Orden">
                            {pregunta.orden ?? "—"}
                          </td>
                          <td data-label="Estado">
                            <span
                              className={`badge-estado ${
                                pregunta.activo ? "ok" : "off"
                              }`}
                            >
                              {pregunta.activo ? "Visible" : "Inactiva"}
                            </span>
                          </td>
                          <td data-label="">
                            <div className="acciones-curso">
                              <Link
                                href={`/panel/preguntas-frecuentes/${pregunta.id}/editar`}
                                className="link-accion"
                              >
                                Editar
                              </Link>
                              <EliminarPregunta
                                preguntaId={pregunta.id}
                                texto={pregunta.pregunta}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}
    </PanelShell>
  );
}