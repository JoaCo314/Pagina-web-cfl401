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

export const dynamic = "force-dynamic";

const CANTIDAD_POR_PAGINA = 50;

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function ConsultasPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/panel/login");
  exigirContrasenaActualizada(user);
  // Disponible para Administrador y Preceptor: las consultas traen datos
  // personales y ambos roles las responden.
  if (!tienePermiso(user, PERMISOS.CONSULTAS_VER)) redirect("/panel");

  const { filtro } = await searchParams;
  const soloNuevas = filtro === "nuevas";

  const [mensajes, totalNuevas] = await Promise.all([
    prisma.mensajeContacto.findMany({
      where: soloNuevas ? { leido: false } : undefined,
      orderBy: { createdAt: "desc" },
      take: CANTIDAD_POR_PAGINA,
    }),
    prisma.mensajeContacto.count({ where: { leido: false } }),
  ]);

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
      )}

      {mensajes.length === CANTIDAD_POR_PAGINA && (
        <p className="form-note">
          Se muestran las {CANTIDAD_POR_PAGINA} consultas más recientes.
        </p>
      )}
    </PanelShell>
  );
}