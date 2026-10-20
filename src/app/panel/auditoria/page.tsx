// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { redirect } from "next/navigation";
import { exigirContrasenaActualizada, getCurrentUser } from "@/lib/auth/session";
import {
  PERMISOS,
  obtenerSeccionesPanel,
  tienePermiso,
} from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import PanelShell from "@/components/auth/PanelShell";
import NavPaginacion from "@/components/panel/NavPaginacion";
import FiltrosAuditoria from "@/components/panel/FiltrosAuditoria";
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

/// Convierte un `YYYY-MM-DD` en el instante UTC del comienzo del día en
/// Argentina (UTC-3): con `fin` devuelve el comienzo del día siguiente, para
/// usarlo como límite exclusivo e incluir toda la fecha final.
function diaUtc(valor: string | undefined, fin: boolean): Date | null {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + (fin ? 1 : 0), 3, 0, 0));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/// Vista de auditoría. Es de solo lectura y exclusiva del Administrador: muestra
/// quién ejecutó cada acción administrativa, cuándo y sobre qué recurso. Los
/// filtros (búsqueda, sección, acción, rol, usuario y período) se combinan en
/// el backend con condiciones AND y no alteran el orden histórico
/// (fecha descendente).
export default async function AuditoriaPanelPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    recurso?: string;
    accion?: string;
    rol?: string;
    usuario?: string;
    desde?: string;
    hasta?: string;
    pagina?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/panel/login");
  exigirContrasenaActualizada(user);
  if (!tienePermiso(user, PERMISOS.AUDITORIA_VER)) redirect("/panel");

  const {
    q,
    recurso,
    accion,
    rol,
    usuario,
    desde,
    hasta,
    pagina: paginaParam,
  } = await searchParams;

  // Roles y usuarios salen de la base: los filtros nunca usan listas
  // inventadas. El rol que usa la auditoría para filtrar es el registrado en
  // cada acción (rol histórico del autor, columna `rol`).
  const [roles, usuarios] = await Promise.all([
    prisma.rol.findMany({ orderBy: { nivel: "desc" } }),
    prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        rol: { select: { nombre: true } },
      },
      orderBy: [{ rol: { nivel: "desc" } }, { apellido: "asc" }, { nombre: "asc" }],
    }),
  ]);

  // Los filtros solo se aplican si coinciden con valores conocidos.
  const recursoFiltro =
    recurso && Object.values(RECURSOS_AUDITORIA).includes(recurso as never)
      ? recurso
      : undefined;
  const accionFiltro =
    accion && accion in ETIQUETAS_ACCION ? accion : undefined;
  const rolFiltro =
    rol && roles.some((r) => r.nombre === rol) ? rol : undefined;

  // Un usuario concreto solo tiene sentido dentro de un rol elegido: si la
  // URL lo trae coherente se aplica, si no se ignora.
  let usuarioFiltro: number | null = null;
  if (usuario && rolFiltro) {
    const numero = Number(usuario);
    if (
      Number.isInteger(numero) &&
      usuarios.some((u) => u.id === numero && u.rol.nombre === rolFiltro)
    ) {
      usuarioFiltro = numero;
    }
  }

  const qLimpia = q?.trim().slice(0, 100) ?? "";
  const inicio = diaUtc(desde, false);
  const fin = diaUtc(hasta, true);
  // Intervalo incoherente (desde posterior a hasta): no se aplica ninguna
  // fecha y se avisa en la interfaz.
  const rangoInvalido =
    desde !== undefined &&
    hasta !== undefined &&
    inicio !== null &&
    fin !== null &&
    inicio >= fin;
  const fechaDesde = rangoInvalido ? null : inicio;
  const fechaHasta = rangoInvalido ? null : fin;

  const condiciones: Prisma.AuditoriaAccionWhereInput[] = [];
  if (recursoFiltro) condiciones.push({ recurso: recursoFiltro });
  if (accionFiltro) condiciones.push({ accion: accionFiltro });
  if (rolFiltro) condiciones.push({ rol: rolFiltro });
  if (usuarioFiltro !== null) condiciones.push({ usuarioId: usuarioFiltro });
  if (qLimpia) {
    const contiene = (busqueda: string) => ({
      contains: busqueda,
      mode: "insensitive" as const,
    });
    condiciones.push({
      OR: [
        { usuarioNombre: contiene(qLimpia) },
        { usuarioEmail: contiene(qLimpia) },
        { resumen: contiene(qLimpia) },
      ],
    });
  }
  if (fechaDesde || fechaHasta) {
    condiciones.push({
      createdAt: {
        ...(fechaDesde ? { gte: fechaDesde } : {}),
        ...(fechaHasta ? { lt: fechaHasta } : {}),
      },
    });
  }
  const donde: Prisma.AuditoriaAccionWhereInput =
    condiciones.length > 0 ? { AND: condiciones } : {};

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

  const hayFiltro = Boolean(
    qLimpia ||
      recursoFiltro ||
      accionFiltro ||
      rolFiltro ||
      usuarioFiltro ||
      fechaDesde ||
      fechaHasta
  );

  const construirHref = (p: number) => {
    const params = new URLSearchParams();
    if (qLimpia) params.set("q", qLimpia);
    if (recursoFiltro) params.set("recurso", recursoFiltro);
    if (accionFiltro) params.set("accion", accionFiltro);
    if (rolFiltro) params.set("rol", rolFiltro);
    if (usuarioFiltro !== null) params.set("usuario", String(usuarioFiltro));
    if (fechaDesde) params.set("desde", desde as string);
    if (fechaHasta) params.set("hasta", hasta as string);
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

      <FiltrosAuditoria
        valores={{
          q: qLimpia,
          recurso: recursoFiltro ?? "",
          accion: accionFiltro ?? "",
          rol: rolFiltro ?? "",
          usuario: usuarioFiltro !== null ? String(usuarioFiltro) : "",
          desde: desde ?? "",
          hasta: hasta ?? "",
        }}
        roles={roles.map((r) => r.nombre)}
        usuarios={usuarios.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          apellido: u.apellido,
          rol: u.rol.nombre,
        }))}
        hayFiltro={hayFiltro}
      />

      {rangoInvalido && (
        <p className="form-aviso" role="alert">
          El período pedido no es válido: la fecha inicial es posterior a la
          final. No se aplicó ningún filtro de fechas.
        </p>
      )}

      {registros.length === 0 ? (
        <p className="panel-vacio">
          {hayFiltro
            ? "No hay acciones que coincidan con estos filtros."
            : "Todavía no hay acciones registradas."}
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
