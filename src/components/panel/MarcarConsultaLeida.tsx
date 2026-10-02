"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

/// Marca la consulta como leída o la devuelve a la bandeja de entrada. Se
/// hace sobre la fila con un botón y no con un check para que el mensaje de
/// éxito no dependa de dónde esté mirando la persona.
export default function MarcarConsultaLeida({
  mensajeId,
  leido,
}: {
  mensajeId: number;
  leido: boolean;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alternar() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetchConTimeout(`/api/consultas/${mensajeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leido: !leido }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo actualizar la consulta.");
        return;
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo actualizar la consulta. Revisá tu conexión e intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <span className="consulta-accion">
      <button
        type="button"
        className="btn-sm btn-ghost-dark"
        onClick={alternar}
        disabled={enviando}
      >
        {enviando
          ? "Guardando…"
          : leido
            ? "Marcar como nueva"
            : "Marcar como leída"}
      </button>
      <span className="form-error" role="alert" aria-live="polite">
        {error ?? ""}
      </span>
    </span>
  );
}