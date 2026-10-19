// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import NavPaginacion from "@/components/panel/NavPaginacion";
import {
  ETIQUETAS_ACCION,
  ETIQUETAS_RECURSO,
  RECURSOS_AUDITORIA,
} from "@/lib/auditoria";

export const dynamic = "force-dynamic";

export const metadata = { title: "Auditoría" };

const CANTIDAD_POR_PAGINA = 30;

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

function paginaValida(valor: string | undefined, totalPaginas: number): number {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1) return 1;
  return Math.min(numero, totalPaginas);
}

/// Vista de auditoría. Es de solo lectura y exclusiva del Administrador: muestra
/// quién ejecutó cada acción administrativa, cuándo y sobre qué recurso.
export default async function AuditoriaPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ recurso?: string; accion?: string; pagina?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/panel/login");
  exigirContrasenaActualizada(user);
  if (!tienePermiso(user, PERMISOS.AUDITORIA_VER)) redirect("/panel");

  const { recurso, accion, pagina: paginaParam } = await searchParams;

  // Los filtros solo se aplican si coinciden con valores conocidos.
  const recursoFiltro =
    recurso && Object.values(RECURSOS_AUDITORIA).includes(recurso as never)
      ? recurso
      : undefined;
  const accionFiltro =
    accion && accion in ETIQUETAS_ACCION ? accion : undefined;

  const donde = {
    ...(recursoFiltro ? { recurso: recursoFiltro } : {}),
    ...(accionFiltro ? { accion: accionFiltro } : {}),
  };

  const totalFiltradas = await prisma.auditoriaAccion.count({ where: donde });
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalFiltradas / CANTIDAD_POR_PAGINA)
  );
  const pagina = paginaValida(paginaParam, totalPaginas);

  const registros = await prisma.auditoriaAccion.findMany({
    where: donde,
    orderBy: { createdAt: "desc" },
    skip: (pagina - 1) * CANTIDAD_POR_PAGINA,
    take: CANTIDAD_POR_PAGINA,
  });

  const construirHref = (
    p: number,
    r: string | undefined = recursoFiltro,
    a: string | undefined = accionFiltro
  ) => {
    const params = new URLSearchParams();
    if (r) params.set("recurso", r);
    if (a) params.set("accion", a);
    if (p > 1) params.set("pagina", String(p));
    const query = params.toString();
    return query ? `/panel/auditoria?${query}` : "/panel/auditoria";
  };

  return (
    <PanelShell user={user} secciones={obtenerSeccionesPanel(user)}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Auditoría</h1>
          <p className="panel-lead">
            Registro de las acciones administrativas: quién creó, editó o
            eliminó contenido y cuándo. Solo visible para el Administrador y no
            se puede modificar.
          </p>
        </div>
      </div>

      <div className="auditoria-filtros">
        <div className="filtros-consultas" aria-label="Filtrar por módulo">
          <a
            href={construirHref(1, undefined, accionFiltro)}
            className={`btn-sm ${!recursoFiltro ? "btn-primary" : "btn-ghost-dark"}`}
            aria-current={!recursoFiltro ? "page" : undefined}
          >
            Todos
          </a>
          {Object.values(RECURSOS_AUDITORIA).map((r) => (
            <a
              key={r}
              href={construirHref(1, r, accionFiltro)}
              className={`btn-sm ${recursoFiltro === r ? "btn-primary" : "btn-ghost-dark"}`}
              aria-current={recursoFiltro === r ? "page" : undefined}
            >
              {ETIQUETAS_RECURSO[r] ?? r}
            </a>
          ))}
        </div>
        <div className="filtros-consultas" aria-label="Filtrar por acción">
          <a
            href={construirHref(1, recursoFiltro, undefined)}
            className={`btn-sm ${!accionFiltro ? "btn-primary" : "btn-ghost-dark"}`}
            aria-current={!accionFiltro ? "page" : undefined}
          >
            Cualquier acción
          </a>
          {Object.entries(ETIQUETAS_ACCION).map(([valor, etiqueta]) => (
            <a
              key={valor}
              href={construirHref(1, recursoFiltro, valor)}
              className={`btn-sm ${accionFiltro === valor ? "btn-primary" : "btn-ghost-dark"}`}
              aria-current={accionFiltro === valor ? "page" : undefined}
            >
              {etiqueta}
            </a>
          ))}
        </div>
      </div>

      {registros.length === 0 ? (
        <p className="panel-vacio">
          Todavía no hay acciones registradas para estos filtros.
        </p>
      ) : (
        <>
          <div className="panel-table-wrap">
            <table className="panel-table">
              <caption className="sr-only">
                Registro de acciones administrativas con su fecha, autor y
                detalle
              </caption>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Usuario</th>
                  <th scope="col">Acción</th>
                  <th scope="col">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Fecha">
                      <time dateTime={r.createdAt.toISOString()}>
                        {formatoFecha.format(r.createdAt)}
                      </time>
                    </td>
                    <td data-label="Usuario">
                      {r.usuarioNombre ? (
                        <>
                          <strong>{r.usuarioNombre}</strong>
                          {r.usuarioEmail && (
                            <span className="td-sub">{r.usuarioEmail}</span>
                          )}
                          {r.rol && (
                            <span className="td-sub">Rol: {r.rol}</span>
                          )}
                        </>
                      ) : (
                        <span className="auditoria-sin-dato">—</span>
                      )}
                    </td>
                    <td data-label="Acción">
                      <span className="auditoria-accion">
                        {ETIQUETAS_ACCION[r.accion] ?? r.accion}
                      </span>
                      <span className="td-sub">
                        {ETIQUETAS_RECURSO[r.recurso] ?? r.recurso}
                      </span>
                    </td>
                    <td data-label="Detalle">
                      {r.resumen && <p className="auditoria-resumen">{r.resumen}</p>}
                      {r.detalle ? (
                        <details className="auditoria-detalle">
                          <summary>Ver datos</summary>
                          <pre>{JSON.stringify(r.detalle, null, 2)}</pre>
                        </details>
                      ) : (
                        <span className="auditoria-sin-dato">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <NavPaginacion
            pagina={pagina}
            totalPaginas={totalPaginas}
            construirHref={(p) => construirHref(p)}
            etiqueta="Paginación de auditoría"
          />
        </>
      )}
    </PanelShell>
  );
}
