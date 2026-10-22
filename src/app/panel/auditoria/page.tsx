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
import TablaAuditoria from "@/components/panel/TablaAuditoria";
import { ETIQUETAS_ACCION, RECURSOS_AUDITORIA } from "@/lib/auditoria";
import type { RegistroAuditoriaUI } from "@/lib/auditoriaPresentacion";

export const dynamic = "force-dynamic";

export const metadata = { title: "Auditoría" };

const CANTIDAD_POR_PAGINA = 30;

function paginaValida(valor: string | undefined, totalPaginas: number): number {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1) return 1;
  return Math.min(numero, totalPaginas);
}

/// Filtro parcial de fecha: cada casilla es opcional y se combinan (solo el año
/// acota al año; año+mes al mes; día+mes+año a un día concreto). Los valores
/// fuera de rango se descartan en silencio porque las casillas ya los limitan.
function parsearFechaParcial(diaStr?: string, mesStr?: string, anioStr?: string): {
  dia?: number;
  mes?: number;
  anio?: number;
} | null {
  const filtro: { dia?: number; mes?: number; anio?: number } = {};
  const dia = Number(diaStr);
  if (Number.isInteger(dia) && dia >= 1 && dia <= 31) filtro.dia = dia;
  const mes = Number(mesStr);
  if (Number.isInteger(mes) && mes >= 1 && mes <= 12) filtro.mes = mes;
  const anio = Number(anioStr);
  if (Number.isInteger(anio) && anio >= 2000 && anio <= 2100) filtro.anio = anio;
  return Object.keys(filtro).length > 0 ? filtro : null;
}

/// Vista de auditoría. Es de solo lectura y exclusiva del Administrador: muestra
/// quién ejecutó cada acción administrativa, cuándo y sobre qué recurso. Los
/// filtros (búsqueda, sección, acción, rol, usuario y fecha) se combinan en
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
    dia?: string;
    mes?: string;
    anio?: string;
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
    dia,
    mes,
    anio,
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
  const filtroFecha = parsearFechaParcial(dia, mes, anio);

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
  // El filtro parcial de fecha (día, mes y/o año) se resuelve con una consulta
  // ligera de ids; Prisma no permite extraer partes de la fecha en `where`.
  if (filtroFecha) {
    const partes: string[] = [];
    if (filtroFecha.dia) partes.push(`EXTRACT(DAY FROM "createdAt") = ${filtroFecha.dia}`);
    if (filtroFecha.mes) partes.push(`EXTRACT(MONTH FROM "createdAt") = ${filtroFecha.mes}`);
    if (filtroFecha.anio) partes.push(`EXTRACT(YEAR FROM "createdAt") = ${filtroFecha.anio}`);
    const filas = await prisma.$queryRawUnsafe<{ id: number }[]>(
      `SELECT id FROM auditoria_acciones WHERE ${partes.join(" AND ")}`
    );
    const idsFecha = filas.map((f) => f.id);
    condiciones.push(
      idsFecha.length > 0 ? { id: { in: idsFecha } } : { id: -1 }
    );
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

  // Los `categoriaId` del detalle llegan como números: si hay alguno en la
  // página actual se traducen al nombre para la vista de detalle.
  const idsCursos = new Set<number>();
  const idsPreguntas = new Set<number>();
  for (const registro of registros) {
    const detalle = registro.detalle;
    if (!detalle || typeof detalle !== "object" || Array.isArray(detalle)) continue;
    const categoriaId = (detalle as Record<string, unknown>).categoriaId;
    if (typeof categoriaId !== "number") continue;
    if (registro.recurso === RECURSOS_AUDITORIA.CURSO) idsCursos.add(categoriaId);
    if (registro.recurso === RECURSOS_AUDITORIA.PREGUNTA) {
      idsPreguntas.add(categoriaId);
    }
  }
  const [categoriasCursos, categoriasPreguntas] = await Promise.all([
    idsCursos.size > 0
      ? prisma.categoriaCurso.findMany({
          where: { id: { in: [...idsCursos] } },
          select: { id: true, nombre: true },
        })
      : Promise.resolve([]),
    idsPreguntas.size > 0
      ? prisma.categoriaPregunta.findMany({
          where: { id: { in: [...idsPreguntas] } },
          select: { id: true, nombre: true },
        })
      : Promise.resolve([]),
  ]);
  const categorias = {
    cursos: Object.fromEntries(
      categoriasCursos.map((c) => [String(c.id), c.nombre])
    ),
    preguntas: Object.fromEntries(
      categoriasPreguntas.map((c) => [String(c.id), c.nombre])
    ),
  };

  const registrosUI: RegistroAuditoriaUI[] = registros.map((registro) => ({
    id: registro.id,
    createdAt: registro.createdAt.toISOString(),
    accion: registro.accion,
    recurso: registro.recurso,
    recursoId: registro.recursoId,
    usuarioNombre: registro.usuarioNombre,
    usuarioEmail: registro.usuarioEmail,
    rol: registro.rol,
    resumen: registro.resumen,
    ip: registro.ip,
    detalle: (registro.detalle ?? null) as Record<string, unknown> | null,
  }));

  const hayFiltro = Boolean(
    qLimpia ||
      recursoFiltro ||
      accionFiltro ||
      rolFiltro ||
      usuarioFiltro ||
      filtroFecha
  );

  const construirHref = (p: number) => {
    const params = new URLSearchParams();
    if (qLimpia) params.set("q", qLimpia);
    if (recursoFiltro) params.set("recurso", recursoFiltro);
    if (accionFiltro) params.set("accion", accionFiltro);
    if (rolFiltro) params.set("rol", rolFiltro);
    if (usuarioFiltro !== null) params.set("usuario", String(usuarioFiltro));
    if (filtroFecha?.dia) params.set("dia", String(filtroFecha.dia));
    if (filtroFecha?.mes) params.set("mes", String(filtroFecha.mes));
    if (filtroFecha?.anio) params.set("anio", String(filtroFecha.anio));
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
          dia: filtroFecha?.dia ? String(filtroFecha.dia) : "",
          mes: filtroFecha?.mes ? String(filtroFecha.mes) : "",
          anio: filtroFecha?.anio ? String(filtroFecha.anio) : "",
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

      {registrosUI.length === 0 ? (
        <p className="panel-vacio">
          {hayFiltro
            ? "No hay acciones que coincidan con estos filtros."
            : "Todavía no hay acciones registradas."}
        </p>
      ) : (
        <>
          <TablaAuditoria registros={registrosUI} categorias={categorias} />
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
