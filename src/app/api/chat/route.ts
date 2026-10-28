import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { ipCliente } from "@/lib/auth/rateLimit";
import { INSTRUCCIONES_CHAT, obtenerContextoChat } from "@/lib/chat/contexto";
import { crearLimiteChat, ErrorSolicitudChat, leerCuerpoChat, validarMensajes } from "@/lib/chat/validacion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const porIp = crearLimiteChat(20, 10 * 60 * 1000);
const limiteGlobal = crearLimiteChat(100, 10 * 60 * 1000);
let solicitudesActivas = 0;

function responder(datos: object, status = 200, espera?: number) {
  return NextResponse.json(datos, { status, headers: {
    "Cache-Control": "no-store",
    ...(espera ? { "Retry-After": String(espera) } : {}),
  } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get("host")) {
        return responder({ error: "La consulta debe enviarse desde el sitio del centro." }, 403);
      }
    } catch {
      return responder({ error: "Origen inválido." }, 403);
    }
  }
  const espera = porIp(ipCliente(request));
  if (espera) return responder({ error: "Hiciste varias consultas seguidas. Probá nuevamente en unos minutos." }, 429, espera);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return responder({ error: "La consulta debe enviarse como JSON." }, 415);
  }

  try {
    const mensajes = validarMensajes(await leerCuerpoChat(request));
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return responder({ error: "El asistente todavía no está habilitado. Podés consultar los cursos o escribirnos desde Contacto." }, 503);
    }
    if (solicitudesActivas >= 5) {
      return responder({ error: "El asistente está atendiendo otras consultas. Intentá de nuevo en un momento." }, 429, 30);
    }
    const esperaGlobal = limiteGlobal("sitio");
    if (esperaGlobal) return responder({ error: "El asistente alcanzó su límite de consultas. Intentá más tarde o escribinos desde Contacto." }, 429, esperaGlobal);

    solicitudesActivas += 1;
    try {
      const contexto = await obtenerContextoChat();
      const client = new OpenAI({ apiKey, timeout: 25_000, maxRetries: 0 });
      const modelo = process.env.OPENAI_MODEL?.trim() || "gpt-6-luna";
      const respuesta = await client.responses.create({
        model: modelo,
        ...(["gpt-6-luna", "gpt-5.4-mini"].includes(modelo) ? { reasoning: { effort: "low" as const } } : {}),
        instructions: INSTRUCCIONES_CHAT,
        input: [
          { role: "developer", content: `Contexto institucional actualizado (JSON):\n${contexto}` },
          ...mensajes,
        ],
        max_output_tokens: 1600,
        store: false,
      }, { signal: request.signal });

      if (respuesta.status !== "completed" || !respuesta.output_text?.trim()) {
        return responder({ error: "No pude completar la respuesta. Probá nuevamente o escribinos desde Contacto." }, 503);
      }
      return responder({ respuesta: respuesta.output_text.trim().slice(0, 6000) });
    } finally {
      solicitudesActivas -= 1;
    }
  } catch (error: unknown) {
    if (error instanceof ErrorSolicitudChat) return responder({ error: error.message }, error.status);
    // No registrar claves, preguntas ni el contexto institucional completo.
    const detalleError =
      error instanceof OpenAI.APIError
        ? { status: error.status }
        : { tipo: error instanceof Error ? error.name : "desconocido" };
    console.error("[Chat] No se pudo responder", detalleError);
    return responder({ error: "El asistente no está disponible en este momento. Intentá más tarde o escribinos desde Contacto." }, 503);
  }
}
