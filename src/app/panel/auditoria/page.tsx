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

/// Meses en español para el filtro parcial por fecha (también se aceptan
/// las abreviaturas de tres letras).
const MESES_ES: Record<string, number> = {
  enero: 1, ene: 1, febrero: 2, feb: 2, marzo: 3, mar: 3, abril: 4, abr: 4,
  mayo: 5, may: 5, junio: 6, jun: 6, julio: 7, jul: 7, agosto: 8, ago: 8,
  septiembre: 9, setiembre: 9, sep: 9, octubre: 10, oct: 10,
  noviembre: 11, nov: 11, diciembre: 12, dic: 12,
};

/// Una sola casilla de fecha admite un día del mes (1-31), un mes en español
/// o un año de cuatro dígitos; lo que no se entienda se descarta con aviso.
function parsearFechaParcial(valor?: string): {
  filtro: { dia?: number; mes?: number; anio?: number } | null;
  invalida: boolean;
} {
  const limpio = valor?.trim().toLowerCase();
  if (!limpio) return { filtro: null, invalida: false };
  if (/^\d{4}$/.test(limpio)) {
    return { filtro: { anio: Number(limpio) }, invalida: false };
  }
  if (/^\d{1,2}$/.test(limpio)) {
    const dia = Number(limpio);
    return dia >= 1 && dia <= 31
      ? { filtro: { dia }, invalida: false }
      : { filtro: null, invalida: true };
  }
  const mes = MESES_ES[limpio];
  if (mes) return { filtro: { mes }, invalida: false };
  return { filtro: null, invalida: true };
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
    fecha?: string;
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
    fecha,
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
  const { filtro: filtroFecha, invalida: fechaInvalida } =
    parsearFechaParcial(fecha);

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
  // El filtro parcial de fecha (día, mes o año) se resuelve con una consulta
  // ligera de ids; Prisma no permite extraer partes de la fecha en `where`.
  if (filtroFecha) {
    let idsFecha: number[] = [];
    if (filtroFecha.dia) {
      const filas = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM auditoria_acciones
        WHERE EXTRACT(DAY FROM "createdAt") = ${filtroFecha.dia}`;
      idsFecha = filas.map((f) => f.id);
    } else if (filtroFecha.mes) {
      const filas = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM auditoria_acciones
        WHERE EXTRACT(MONTH FROM "createdAt") = ${filtroFecha.mes}`;
      idsFecha = filas.map((f) => f.id);
    } else if (filtroFecha.anio) {
      const filas = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM auditoria_acciones
        WHERE EXTRACT(YEAR FROM "createdAt") = ${filtroFecha.anio}`;
      idsFecha = filas.map((f) => f.id);
    }
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
    if (filtroFecha && fecha?.trim()) params.set("fecha", fecha.trim());
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
          fecha: fecha?.trim() ?? "",
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

      {fechaInvalida && (
        <p className="form-aviso" role="alert">
          No se reconoció «{fecha}»: escribí un día (ej: 17), un mes en español
          (ej: octubre) o un año (ej: 2026).
        </p>
      )}

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
