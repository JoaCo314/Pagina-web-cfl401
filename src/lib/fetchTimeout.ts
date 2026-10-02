/// `fetch` con tiempo máximo. Sin esto, un request al panel puede quedar
/// cargando para siempre (red caída, servidor saturado) y la pantalla queda
/// bloqueada con el botón deshabilitado sin explicación.
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`La operación tardó demasiado (${Math.round(ms / 1000)}s).`);
    this.name = "TimeoutError";
  }
}

export async function fetchConTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  ms = 15000
): Promise<Response> {
  const controller = new AbortController();
  const temporizador = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError(ms);
    }
    throw err;
  } finally {
    clearTimeout(temporizador);
  }
}