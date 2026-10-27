export const MAX_PREGUNTA = 1000;
export const MAX_MENSAJES = 9;
export const MAX_CUERPO = 24_000;

export type MensajeChat = { role: "user" | "assistant"; content: string };

export class ErrorSolicitudChat extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function validarMensajes(body: unknown): MensajeChat[] {
  if (!body || typeof body !== "object" || !("mensajes" in body)) {
    throw new ErrorSolicitudChat("Ingresá una consulta.");
  }
  const mensajes = body.mensajes;
  if (!Array.isArray(mensajes) || mensajes.length === 0 ||
      mensajes.length > MAX_MENSAJES || mensajes.length % 2 !== 1) {
    throw new ErrorSolicitudChat("El historial de la consulta es inválido.");
  }
  let total = 0;
  return mensajes.map((mensaje: unknown, indice) => {
    if (!mensaje || typeof mensaje !== "object" ||
        !("role" in mensaje) || !("content" in mensaje)) {
      throw new ErrorSolicitudChat("El mensaje es inválido.");
    }
    const role = indice % 2 === 0 ? "user" : "assistant";
    const maximo = role === "user" ? MAX_PREGUNTA : 6000;
    if (mensaje.role !== role || typeof mensaje.content !== "string" ||
        !mensaje.content.trim() || mensaje.content.length > maximo) {
      throw new ErrorSolicitudChat(`La consulta admite hasta ${MAX_PREGUNTA} caracteres y un historial breve.`);
    }
    total += mensaje.content.length;
    if (total > 12_000) {
      throw new ErrorSolicitudChat("El historial es demasiado largo. Iniciá una nueva conversación.");
    }
    return { role, content: mensaje.content.trim() };
  });
}

// Limita también cuerpos sin Content-Length, antes de parsearlos como JSON.
export async function leerCuerpoChat(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > MAX_CUERPO) {
    throw new ErrorSolicitudChat("La consulta es demasiado larga.", 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ErrorSolicitudChat("Ingresá una consulta.");
  const bloques: Uint8Array[] = [];
  let longitud = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      longitud += value.byteLength;
      if (longitud > MAX_CUERPO) {
        await reader.cancel();
        throw new ErrorSolicitudChat("La consulta es demasiado larga.", 413);
      }
      bloques.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(longitud);
  let offset = 0;
  for (const bloque of bloques) {
    bytes.set(bloque, offset);
    offset += bloque.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ErrorSolicitudChat("La consulta debe enviarse como JSON válido.");
  }
}

// Ventanas fijas, con limpieza y tamaño acotado. Estado por proceso, como los
// otros límites del proyecto; con varias réplicas se debe compartir en Redis.
export function crearLimiteChat(maximo: number, ventanaMs: number) {
  const registros = new Map<string, { cantidad: number; hasta: number }>();
  return (clave: string, ahora = Date.now()): number => {
    for (const [ip, registro] of registros) {
      if (registro.hasta <= ahora) registros.delete(ip);
    }
    let registro = registros.get(clave);
    if (!registro) {
      if (registros.size >= 10_000) return Math.ceil(ventanaMs / 1000);
      registro = { cantidad: 0, hasta: ahora + ventanaMs };
      registros.set(clave, registro);
    }
    if (registro.cantidad >= maximo) {
      return Math.max(1, Math.ceil((registro.hasta - ahora) / 1000));
    }
    registro.cantidad += 1;
    return 0;
  };
}
