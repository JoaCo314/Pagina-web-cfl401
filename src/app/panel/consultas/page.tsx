import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";
import MarcarConsultaLeida from "@/components/panel/MarcarConsultaLeida";
import NavPaginacion from "@/components/panel/NavPaginacion";

export const dynamic = "force-dynamic";

const CANTIDAD_POR_PAGINA = 25;

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

export default async function ConsultasPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; pagina?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/panel/login");
  exigirContrasenaActualizada(user);
  // Disponible para Administrador y Preceptor: las consultas traen datos
  // personales y ambos roles las responden.
  if (!tienePermiso(user, PERMISOS.CONSULTAS_VER)) redirect("/panel");

  const { filtro, pagina: paginaParam } = await searchParams;
  const soloNuevas = filtro === "nuevas";
  const donde = soloNuevas ? { leido: false } : undefined;

  const [totalFiltradas, totalNuevas] = await Promise.all([
    prisma.mensajeContacto.count({ where: donde }),
    prisma.mensajeContacto.count({ where: { leido: false } }),
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalFiltradas / CANTIDAD_POR_PAGINA)
  );
  const pagina = paginaValida(paginaParam, totalPaginas);

  const mensajes = await prisma.mensajeContacto.findMany({
    where: donde,
    orderBy: { createdAt: "desc" },
    skip: (pagina - 1) * CANTIDAD_POR_PAGINA,
    take: CANTIDAD_POR_PAGINA,
  });

  const construirHref = (p: number) => {
    const params = new URLSearchParams();
    if (soloNuevas) params.set("filtro", "nuevas");
    if (p > 1) params.set("pagina", String(p));
    const query = params.toString();
    return query ? `/panel/consultas?${query}` : "/panel/consultas";
  };

  return (
    <PanelShell user={user} secciones={obtenerSeccionesPanel(user)}>
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Consultas</h1>
          <p className="panel-lead">
            Mensajes que llegan por el formulario de contacto del sitio. Se
            guardan en la base: no se envían por correo. Respondé desde tu
            casilla y marcá la consulta como leída cuando la tengas cerrada.
          </p>
        </div>
        <nav className="filtros-consultas" aria-label="Filtrar consultas">
          <a
            href="/panel/consultas"
            className={soloNuevas ? "btn-sm btn-ghost-dark" : "btn-sm btn-primary"}
            aria-current={!soloNuevas ? "page" : undefined}
          >
            Todas
          </a>
          <a
            href="/panel/consultas?filtro=nuevas"
            className={soloNuevas ? "btn-sm btn-primary" : "btn-sm btn-ghost-dark"}
            aria-current={soloNuevas ? "page" : undefined}
          >
            Sin leer{totalNuevas > 0 ? ` (${totalNuevas})` : ""}
          </a>
        </nav>
      </div>

      {mensajes.length === 0 ? (
        <p className="panel-vacio">
          {soloNuevas
            ? "No hay consultas sin leer."
            : "Todavía no llegó ninguna consulta por el formulario de contacto."}
        </p>
      ) : (
        <>
          <ul className="consultas-lista">
          {mensajes.map((m) => (
            <li
              key={m.id}
              className={`consulta${m.leido ? " leida" : ""}`}
            >
              <div className="consulta-cabecera">
                <h2 className="consulta-remitente">{m.nombre}</h2>
                <span className={`badge-estado ${m.leido ? "off" : "pendiente"}`}>
                  {m.leido ? "Leída" : "Nueva"}
                </span>
              </div>
              <p className="consulta-meta">
                <a href={`mailto:${m.email}`}>{m.email}</a>
                {m.celular && (
                  <>
                    {" · "}
                    <a href={`tel:${m.celular.replace(/[^+\d]/g, "")}`}>
                      {m.celular}
                    </a>
                  </>
                )}
                {" · "}
                <time dateTime={m.createdAt.toISOString()}>
                  {formatoFecha.format(m.createdAt)}
                </time>
                {m.curso && <>{" · "}Interés: {m.curso}</>}
              </p>
              <p className="consulta-mensaje">{m.mensaje}</p>
              <div className="consulta-acciones">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(
                    `Consulta desde el sitio - CFL 401`
                  )}`}
                  className="btn-sm btn-primary"
                >
                  Responder por correo
                </a>
                <MarcarConsultaLeida
                  mensajeId={m.id}
                  leido={m.leido}
                />
              </div>
            </li>
          ))}
          </ul>
          <NavPaginacion
            pagina={pagina}
            totalPaginas={totalPaginas}
            construirHref={construirHref}
            etiqueta="Paginación de consultas"
          />
        </>
      )}
    </PanelShell>
  );
}