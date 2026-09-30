"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BlanquearContrasena({
  usuarioId,
  nombre,
}: {
  usuarioId: number;
  nombre: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function blanquear() {
    const confirmado = window.confirm(
      `¿Blanquear la contraseña de ${nombre}?\n\nLa contraseña temporal pasan a ser los últimos 4 dígitos de su DNI (columna DNI del listado). Hay que comunicárselos a la persona: al ingresar, el sistema le va a pedir que la cambie por una nueva.`
    );
    if (!confirmado) {
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "blanquearContrasena" }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo blanquear la contraseña.");
        return;
      }

      window.alert(
        `Contraseña blanqueada.\n\nComunicale a ${nombre} los últimos 4 dígitos de su DNI: al ingresar al panel, el sistema le va a pedir que elija una contraseña nueva.`
      );
      router.refresh();
    } catch {
      setError("No se pudo blanquear la contraseña. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <span className="acciones-usuario">
      <button
        type="button"
        className="btn-sm btn-ghost-dark"
        onClick={blanquear}
        disabled={enviando}
      >
        {enviando ? "Blanqueando…" : "Blanquear contraseña"}
      </button>
      {error && <span className="form-error">{error}</span>}
    </span>
  );
}