import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import {
  obtenerSeccionesPanel,
  tienePermiso,
  PERMISOS,
} from "@/lib/auth/autorizacion";
import { ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import PanelShell from "@/components/auth/PanelShell";

export const dynamic = "force-dynamic";

type Stat = { etiqueta: string; valor: string };

export default async function PanelPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }

  const secciones = obtenerSeccionesPanel(user);
  const estadisticas: Stat[] = [];
  let sobreElCentroCargado: boolean | null = null;

  const misCursos =
    user.rol.nombre === ROLES.DOCENTE
      ? await prisma.curso.findMany({
          where: { docentes: { some: { docenteId: user.id } }, activo: true },
          select: { id: true, nombre: true, horarios: true },
          orderBy: [{ nombre: "asc" }],
        })
      : null;

  if (tienePermiso(user, PERMISOS.CURSOS_VER)) {
    estadisticas.push({
      etiqueta:
        user.rol.nombre === ROLES.DOCENTE
          ? "Cursos asignados"
          : "Cursos activos",
      valor:
        user.rol.nombre === ROLES.DOCENTE
          ? String(misCursos?.length ?? 0)
          : String(
              await prisma.curso.count({ where: { activo: true } })
            ),
    });
  }

  if (tienePermiso(user, PERMISOS.USUARIOS_VER_TODOS)) {
    estadisticas.push({
      etiqueta: "Usuarios activos",
      valor: String(await prisma.usuario.count({ where: { activo: true } })),
    });
  }

  if (tienePermiso(user, PERMISOS.NOTICIAS_CREAR)) {
    estadisticas.push({
      etiqueta: "Noticias publicadas",
      valor: String(await prisma.noticia.count({ where: { activo: true } })),
    });
  }

  if (tienePermiso(user, PERMISOS.GUIA_EDITAR)) {
    estadisticas.push({
      etiqueta: "Bloques en la guía",
      valor: String(await prisma.contenidoGuia.count({ where: { activo: true } })),
    });
  }

  if (tienePermiso(user, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    estadisticas.push(
      {
        etiqueta: "Preguntas frecuentes",
        valor: String(
          await prisma.preguntaFrecuente.count({ where: { activo: true } })
        ),
      },
      {
        etiqueta: "Categorías de preguntas",
        valor: String(
          await prisma.categoriaPregunta.count({ where: { activo: true } })
        ),
      }
    );
  }

  if (tienePermiso(user, PERMISOS.SOBRE_EL_CENTRO_EDITAR)) {
    const sobre = await prisma.sobreElCentro.findFirst({
      where: { activo: true },
    });
    sobreElCentroCargado = sobre !== null;
  }

  const atajos = secciones.filter((s) => s.clave !== "inicio");

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Hola, {user.nombre}</h1>
      <p className="panel-lead">
        {user.rol.nombre === ROLES.DOCENTE
          ? "Resumen de los cursos que te fueron asignados: podés editarlos, pero no eliminar tus cursos ni modificar la asignación de docentes. No tenés acceso a los cursos de otros docentes ni a las secciones administrativas."
          : "Resumen del estado de la plataforma y accesos directos a cada sección que administrás."}
      </p>

      {estadisticas.length > 0 && (
        <section className="panel-stats">
          {estadisticas.map((stat) => (
            <div className="panel-stat" key={stat.etiqueta}>
              <strong>{stat.valor}</strong>
              <span>{stat.etiqueta}</span>
            </div>
          ))}
        </section>
      )}

      {sobreElCentroCargado === false && (
        <div className="panel-aviso">
          <p>
            La página institucional todavía no tiene contenido cargado.{" "}
            <Link href="/panel/sobre-el-centro">Cargarla ahora</Link>.
          </p>
        </div>
      )}

      <h2 className="panel-seccion-titulo">Atajos</h2>
      <section className="panel-cards">
        {misCursos && (
          <article className="panel-card panel-card-wide">
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
                Todavía no tenés cursos asignados. Un administrador o preceptor
                deberá asignártelos.
              </p>
            )}
          </article>
        )}

        {atajos.map((seccion) => (
          <Link
            key={seccion.clave}
            href={seccion.href ?? "/panel"}
            className="panel-card panel-card-link"
          >
            <h2>{seccion.titulo}</h2>
            <p>{seccion.descripcion}</p>
          </Link>
        ))}
      </section>
    </PanelShell>
  );
}