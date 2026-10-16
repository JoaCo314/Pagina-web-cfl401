// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { respuestaSiContrasenaTemporal } from "@/lib/auth/guardias";
import { PERMISOS, tienePermiso, puedeGestionarCurso } from "@/lib/auth/autorizacion";
import { CURSO_SELECT, validarListaDocentes } from "@/lib/cursoAdmin";
import { ipCliente } from "@/lib/auth/rateLimit";
import {
  ACCIONES_AUDITORIA,
  RECURSOS_AUDITORIA,
  registrarAuditoria,
} from "@/lib/auditoria";

export const dynamic = "force-dynamic";

/// Consulta la asignación actual de docentes de un curso (RF-11).
/// Requiere sesión con permiso de ver cursos.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cursoId = Number(id);
  if (!Number.isInteger(cursoId) || cursoId <= 0) {
    return NextResponse.json(
      { error: "ID de curso inválido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!tienePermiso(user, PERMISOS.CURSOS_VER)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const curso = await prisma.curso.findUnique({
    where: { id: cursoId },
    select: CURSO_SELECT,
  });
  if (!curso) {
    return NextResponse.json(
      { error: "El curso solicitado no existe." },
      { status: 404 }
    );
  }

  // RF-16: un Docente solo consulta los cursos que tiene asignados. Se responde
  // 404 (y no 403) para no revelar la existencia de cursos ajenos. Administrador
  // y Preceptor siguen viendo cualquier curso, incluidos los inactivos.
  if (!puedeGestionarCurso(user, curso)) {
    return NextResponse.json(
      { error: "El curso solicitado no existe." },
      { status: 404 }
    );
  }

  return NextResponse.json({ curso });
}

/// Asigna/desasigna docentes a un curso (RF-11). Recibe `docenteIds` con la
/// lista completa de docentes que deben quedar asignados (lista vacía =
/// desasignar todos, soporta múltiples docentes). Es idempotente: reemplaza la
/// asignación actual en una transacción. Restricción (RF-12): solo
/// Administrador y Preceptor; un Docente no puede modificar ninguna asignación,
/// ni siquiera la propia.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cursoId = Number(id);
  if (!Number.isInteger(cursoId) || cursoId <= 0) {
    return NextResponse.json(
      { error: "ID de curso inválido" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!tienePermiso(user, PERMISOS.CURSOS_ASIGNAR_DOCENTES)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  const existente = await prisma.curso.findUnique({
    where: { id: cursoId },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "El curso no existe." },
      { status: 404 }
    );
  }

  const bloqueado = respuestaSiContrasenaTemporal(user);
  if (bloqueado) return bloqueado;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida: se esperaba un JSON." },
      { status: 400 }
    );
  }

  const norm = await validarListaDocentes(
    (body as Record<string, unknown>)?.docenteIds
  );
  if (!norm.ok) {
    return NextResponse.json({ error: norm.error }, { status: 400 });
  }

  try {
    await prisma.$transaction([
      prisma.cursoDocente.deleteMany({ where: { cursoId } }),
      ...(norm.ids.length > 0
        ? [
            prisma.cursoDocente.createMany({
              data: norm.ids.map((docenteId) => ({ cursoId, docenteId })),
            }),
          ]
        : []),
    ]);

    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: CURSO_SELECT,
    });

    await registrarAuditoria({
      usuario: user,
      accion: ACCIONES_AUDITORIA.ASIGNAR_DOCENTES,
      recurso: RECURSOS_AUDITORIA.CURSO,
      recursoId: cursoId,
      resumen: `Curso «${curso?.nombre ?? cursoId}»`,
      detalle: { cantidad: norm.ids.length },
      ip: ipCliente(request),
    });

    return NextResponse.json({ curso });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}