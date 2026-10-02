import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esEmailValido } from "@/lib/validaciones";
import { crearLimitador, ipCliente } from "@/lib/auth/rateLimit";

export const dynamic = "force-dynamic";

/// Consulta del formulario público de /contacto. La API guarda el mensaje y el
/// Administrador lo lee desde el panel: antes solo respondía "ok" sin guardar
/// nada, así que toda consulta se perdía.
///
/// Dos topes, ambos sobre el total de envíos (no solo los fallidos: lo que se
/// busca frenar es el volumen de consultas, porque cada una escribe una fila):
///
/// - Por IP: frena el envío masivo desde una sola conexión.
/// - Por correo: frena que una misma casilla mande consultas repetidas.
///
/// Son dos instancias y no una con dos límites porque la identidad solo se
/// conoce después de parsear el cuerpo, y el límite por IP tiene que poder
/// actuar antes (sobre un body enorme o mal formado).
const DURACION_MS = 10 * 60 * 1000;
const limitePorIp = crearLimitador({
  maxIntentos: 20,
  duracionMs: DURACION_MS,
  contarAciertos: true,
});
const limitePorCorreo = crearLimitador({
  maxIntentos: 5,
  duracionMs: DURACION_MS,
  contarAciertos: true,
});

function respuesta429(esperaSegundos: number) {
  return NextResponse.json(
    {
      error: "Demasiados envíos seguidos. Probá de nuevo en unos minutos.",
      esperaSegundos,
    },
    { status: 429 }
  );
}

const LARGO_MAXIMO = {
  nombre: 120,
  email: 200,
  curso: 120,
  mensaje: 2000,
} as const;

function texto(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const limpio = value.trim();
  if (!limpio || limpio.length > max) return null;
  return limpio;
}

export async function POST(request: NextRequest) {
  // El límite por IP actúa antes de parsear el cuerpo: un envío con un body
  // enorme o inválido también consume presupuesto.
  const ip = ipCliente(request);
  const limiteIp = limitePorIp.chequear(ip);
  if (!limiteIp.permitido) return respuesta429(limiteIp.esperaSegundos);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const fuente = body as Record<string, unknown>;

  // Honeypot: campo invisible que solo completa un bot. Si viene con algo, se
  // responde como si fuera correcto para no darle pistas, pero no se guarda.
  if (texto(fuente["sitio-web"], 200)) {
    return NextResponse.json({ ok: true });
  }

  const nombre = texto(fuente.nombre, LARGO_MAXIMO.nombre);
  if (!nombre) {
    return NextResponse.json(
      { error: "Ingresá tu nombre." },
      { status: 400 }
    );
  }

  const email = texto(fuente.email, LARGO_MAXIMO.email);
  if (!email || !esEmailValido(email)) {
    return NextResponse.json(
      { error: "Ingresá un correo electrónico válido." },
      { status: 400 }
    );
  }

  const mensaje = texto(fuente.mensaje, LARGO_MAXIMO.mensaje);
  if (!mensaje) {
    return NextResponse.json(
      { error: "Ingresá tu consulta." },
      { status: 400 }
    );
  }

  const curso = texto(fuente.curso, LARGO_MAXIMO.curso);

  // Normalizado para que "Ana@x.com" y "ana@x.com" compartan el mismo tope.
  const limiteCorreo = limitePorCorreo.chequear(email.toLowerCase());
  if (!limiteCorreo.permitido) return respuesta429(limiteCorreo.esperaSegundos);

  try {
    await prisma.mensajeContacto.create({
      data: { nombre, email, mensaje, curso: curso ?? null, ip },
    });
  } catch (err) {
    console.error("[API] Error interno:", err);
    return NextResponse.json(
      { error: "No se pudo registrar la consulta. Intentá nuevamente." },
      { status: 500 }
    );
  }

  // No se limpian los contadores como en el login: acá cada POST escribe una
  // fila y lo que se busca frenar es el volumen, no los errores.
  return NextResponse.json({
    ok: true,
    mensaje: "Consulta enviada correctamente. Te responderemos a la brevedad.",
  });
}