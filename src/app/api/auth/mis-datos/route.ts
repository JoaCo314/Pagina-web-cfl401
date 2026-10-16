// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { respuestaSiContrasenaTemporal } from "@/lib/auth/guardias";
import { esEmailValido, esTelefonoValido } from "@/lib/validaciones";

export const dynamic = "force-dynamic";

/// Edición de los datos de contacto de la cuenta propia: email y teléfono. El
/// nombre, el apellido y el DNI no se tocan desde acá (los gestiona el panel).
/// El teléfono es solo para comunicación interna: nunca se muestra en el sitio
/// público.
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
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

  const fuente = (body ?? {}) as Record<string, unknown>;
  const cambios: Record<string, unknown> = {};

  if (fuente.email !== undefined) {
    if (typeof fuente.email !== "string" || !fuente.email.trim()) {
      return NextResponse.json(
        { error: "El email es obligatorio." },
        { status: 400 }
      );
    }
    const email = fuente.email.trim().toLowerCase();
    if (email.length > 200) {
      return NextResponse.json(
        { error: "El email no puede superar 200 caracteres." },
        { status: 400 }
      );
    }
    if (!esEmailValido(email)) {
      return NextResponse.json(
        { error: "El email no tiene un formato válido." },
        { status: 400 }
      );
    }
    if (email !== user.email) {
      // Unicidad case-insensitive: se consulta antes para dar un 409 claro.
      const enUso = await prisma.usuario.findFirst({
        where: { email: { equals: email, mode: "insensitive" }, NOT: { id: user.id } },
        select: { id: true },
      });
      if (enUso) {
        return NextResponse.json(
          { error: "Ese email ya está en uso por otra cuenta." },
          { status: 409 }
        );
      }
      cambios.email = email;
    }
  }

  if (fuente.telefono !== undefined) {
    if (fuente.telefono === null || fuente.telefono === "") {
      // Vaciar el teléfono es válido: se guarda como nulo.
      cambios.telefono = null;
    } else if (typeof fuente.telefono !== "string") {
      return NextResponse.json(
        { error: "El teléfono no es válido." },
        { status: 400 }
      );
    } else {
      const telefono = fuente.telefono.trim();
      if (!esTelefonoValido(telefono)) {
        return NextResponse.json(
          {
            error:
              "El teléfono no es válido. Usá solo números y, si querés, +, espacios, guiones o paréntesis.",
          },
          { status: 400 }
        );
      }
      cambios.telefono = telefono;
    }
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json(
      { error: "No se enviaron campos para actualizar." },
      { status: 400 }
    );
  }

  try {
    const actualizado = await prisma.usuario.update({
      where: { id: user.id },
      data: cambios,
      select: { id: true, email: true, telefono: true },
    });

    return NextResponse.json({ usuario: actualizado });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intentá nuevamente." },
      { status: 500 }
    );
  }
}
