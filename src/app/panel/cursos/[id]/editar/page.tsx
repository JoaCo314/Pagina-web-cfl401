import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PERMISOS, obtenerSeccionesPanel, tienePermiso } from "@/lib/auth/autorizacion";
import { prisma } from "@/lib/prisma";
import { CURSO_SELECT, obtenerDocentesActivos } from "@/lib/cursoAdmin";
import PanelShell from "@/components/auth/PanelShell";
import CursoForm from "@/components/panel/CursoForm";
import type { CursoFormInicial } from "@/components/panel/CursoForm";

export const dynamic = "force-dynamic";

export default async function EditarCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cursoId = Number(id);
  if (!Number.isInteger(cursoId) || cursoId <= 0) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/panel/login");
  }
  if (!tienePermiso(user, PERMISOS.CURSOS_EDITAR)) {
    redirect("/panel");
  }

  const [curso, docentes] = await Promise.all([
    prisma.curso.findUnique({
      where: { id: cursoId },
      select: CURSO_SELECT,
    }),
    obtenerDocentesActivos(),
  ]);

  if (!curso) {
    notFound();
  }

  const inicial: CursoFormInicial = {
    id: curso.id,
    nombre: curso.nombre,
    descripcion: curso.descripcion,
    modalidad: curso.modalidad,
    horarios: curso.horarios,
    mesesCursada: curso.mesesCursada,
    fechaInicio: curso.fechaInicio
      ? new Date(curso.fechaInicio).toISOString().slice(0, 10)
      : null,
    programaContenidos: curso.programaContenidos,
    categoria: curso.categoria,
    cupos: curso.cupos,
    imagenUrl: curso.imagenUrl,
    informacionAdicional: curso.informacionAdicional,
    activo: curso.activo,
    docentes: curso.docentes.map((d) => ({ docenteId: d.docenteId })),
  };

  const secciones = obtenerSeccionesPanel(user);

  return (
    <PanelShell user={user} secciones={secciones}>
      <h1 className="panel-title">Editar curso</h1>
      <p className="panel-lead">
        Modificá la información del curso <strong>{curso.nombre}</strong>. Los
        campos no enviados conservan su valor actual.
      </p>
      <CursoForm
        docentes={docentes}
        inicial={inicial}
        puedeAsignarDocentes={tienePermiso(
          user,
          PERMISOS.CURSOS_ASIGNAR_DOCENTES
        )}
      />
    </PanelShell>
  );
}