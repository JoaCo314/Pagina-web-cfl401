import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { respuestaSiContrasenaTemporal } from "@/lib/auth/guardias";
import { PERMISOS, tienePermiso } from "@/lib/auth/autorizacion";
import { validarCategoriaPregunta } from "@/lib/preguntasFrecuentes";

export const dynamic = "force-dynamic";

/// Listado de categorías de preguntas frecuentes (todas, incluidas inactivas).
/// Es un endpoint de panel: requiere sesión y permiso de edición de FAQs, igual
/// que el resto de las rutas privadas de esta familia. El sitio público consume
/// las categorías ya filtradas dentro de GET /api/preguntas-frecuentes.
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
    );
  }

  if (user.debeCambiarContrasena) {
    return NextResponse.json(
      { error: "Primero tenés que cambiar tu contraseña temporal." },
      { status: 403 }
    );
  }

  try {
    const categorias = await prisma.categoriaPregunta.findMany({
      select: {
        id: true,
        nombre: true,
        orden: true,
        activo: true,
        _count: { select: { preguntas: true } },
      },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    });

    return NextResponse.json({ categorias });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}

/// Alta de categoría de preguntas frecuentes (panel): Administrador y Preceptor.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!tienePermiso(user, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    return NextResponse.json(
      { error: "No tenés permiso para realizar esta acción." },
      { status: 403 }
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

  const resultado = validarCategoriaPregunta(body);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  try {
    const categoria = await prisma.categoriaPregunta.create({
      data: {
        nombre: resultado.valor,
        orden: resultado.orden,
      },
      select: { id: true, nombre: true, orden: true, activo: true },
    });

    return NextResponse.json({ categoria }, { status: 201 });
  } catch (err) {
    console.error("[API] Error interno:", err);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}