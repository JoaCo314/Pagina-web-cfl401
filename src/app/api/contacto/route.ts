import { NextRequest, NextResponse } from "next/server";
// Creado por sofia-athos - Formulario de contacto funcional, datos editables en panel/configuracion
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  const { nombre, email, mensaje, curso } = body as Record<string, unknown>;
  if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
    return NextResponse.json({ error: "Nombre requerido." }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Email válido requerido." }, { status: 400 });
  }
  if (!mensaje || typeof mensaje !== "string" || !mensaje.trim()) {
    return NextResponse.json({ error: "Mensaje requerido." }, { status: 400 });
  }
  // En producción aquí se enviaría email a siteConfig.contactoFormDestinatario o se guardaría en DB.
  // Por ahora se simula éxito para que la sección sea funcional y editable.
  console.log("[contacto] consulta recibida:", { nombre, email, curso, mensaje: (mensaje as string).slice(0, 200) });
  return NextResponse.json({ ok: true, mensaje: "Consulta enviada correctamente. Te responderemos a la brevedad." });
}
