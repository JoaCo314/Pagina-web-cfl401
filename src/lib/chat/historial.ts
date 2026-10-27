import { MAX_PREGUNTA, type MensajeChat } from "./validacion";

export const CLAVE_HISTORIAL_CHAT = "cfl401.chat.v1";
export const DURACION_HISTORIAL_CHAT = 24 * 60 * 60 * 1000;
export const MAX_HISTORIAL_CHAT = 40; // Veinte intercambios completos.

type HistorialChat = { mensajes: MensajeChat[]; expiraEn: number };
type StorageChat = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export const HISTORIAL_CHAT_VACIO: HistorialChat = { mensajes: [], expiraEn: 0 };

function interpretarHistorial(valor: string | null, ahora: number): HistorialChat {
  if (!valor || valor.length > 160_000) return HISTORIAL_CHAT_VACIO;
  try {
    const datos = JSON.parse(valor);
    if (datos.version !== 1 || !Number.isFinite(datos.expiraEn) ||
        datos.expiraEn <= ahora || datos.expiraEn > ahora + DURACION_HISTORIAL_CHAT ||
        !Array.isArray(datos.mensajes) || datos.mensajes.length === 0 ||
        datos.mensajes.length > MAX_HISTORIAL_CHAT || datos.mensajes.length % 2 !== 0) {
      return HISTORIAL_CHAT_VACIO;
    }
    const mensajes: MensajeChat[] = [];
    for (const [indice, mensaje] of datos.mensajes.entries()) {
      const role = indice % 2 === 0 ? "user" : "assistant";
      if (!mensaje || mensaje.role !== role || typeof mensaje.content !== "string" ||
          !mensaje.content.trim() || mensaje.content.length > (role === "user" ? MAX_PREGUNTA : 6000)) {
        return HISTORIAL_CHAT_VACIO;
      }
      mensajes.push({ role, content: mensaje.content });
    }
    return { mensajes, expiraEn: datos.expiraEn };
  } catch {
    return HISTORIAL_CHAT_VACIO;
  }
}

// Snapshot estable para useSyncExternalStore. La lectura de localStorage se
// realiza al suscribirse, después de la hidratación; nunca durante el SSR.
export function crearAlmacenHistorial(obtenerStorage: () => StorageChat, ahora = Date.now) {
  let historial = HISTORIAL_CHAT_VACIO;
  const oyentes = new Set<() => void>();
  function notificar() { oyentes.forEach((oyente) => oyente()); }
  function quitarGuardado() {
    try { obtenerStorage().removeItem(CLAVE_HISTORIAL_CHAT); } catch { /* Storage bloqueado: seguir en memoria. */ }
  }
  function leer() {
    return historial.expiraEn > ahora() ? historial : HISTORIAL_CHAT_VACIO;
  }
  function restaurar() {
    let valor: string | null;
    try { valor = obtenerStorage().getItem(CLAVE_HISTORIAL_CHAT); } catch { return; }
    historial = interpretarHistorial(valor, ahora());
    if (valor && historial === HISTORIAL_CHAT_VACIO) quitarGuardado();
    notificar();
  }
  function borrar() {
    historial = HISTORIAL_CHAT_VACIO;
    quitarGuardado();
    notificar();
  }
  return {
    leer,
    restaurar,
    borrar,
    suscribir(oyente: () => void) {
      oyentes.add(oyente);
      restaurar();
      return () => { oyentes.delete(oyente); };
    },
    guardar(mensajes: MensajeChat[]) {
      if (!mensajes.length) { borrar(); return; }
      const valor = JSON.stringify({ version: 1, expiraEn: ahora() + DURACION_HISTORIAL_CHAT,
        mensajes: mensajes.slice(-MAX_HISTORIAL_CHAT) });
      historial = interpretarHistorial(valor, ahora());
      if (historial === HISTORIAL_CHAT_VACIO) { borrar(); return; }
      try { obtenerStorage().setItem(CLAVE_HISTORIAL_CHAT, valor); } catch { /* Conservar en memoria. */ }
      notificar();
    },
    expirar() {
      if (historial !== HISTORIAL_CHAT_VACIO && historial.expiraEn <= ahora()) borrar();
    },
  };
}

export const almacenHistorialChat = crearAlmacenHistorial(() => window.localStorage);
export const historialChatServidor = () => HISTORIAL_CHAT_VACIO;
