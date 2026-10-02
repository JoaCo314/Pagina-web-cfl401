"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

export default function BlanquearContrasena({
  usuarioId,
  nombre,
  esPropio,
}: {
  usuarioId: number;
  nombre: string;
  esPropio: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [listo, setListo] = useState(false);

  if (esPropio) {
    return <span className="td-sub">Tu cuenta</span>;
  }

  async function blanquear() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetchConTimeout(`/api/admin/usuarios/${usuarioId}`, {
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

      setConfirmar(false);
      setListo(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo blanquear la contraseña. Revisá tu conexión e intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <span className="acciones-usuario">
      <button
        type="button"
        className="btn-sm btn-ghost-dark"
        onClick={() => {
          setError(null);
          setListo(false);
          setConfirmar(true);
        }}
        disabled={enviando}
      >
        {enviando ? "Blanqueando…" : "Blanquear contraseña"}
      </button>
      <span className="form-error" role="alert" aria-live="polite">
        {error ?? ""}
      </span>
      {listo && (
        <span className="td-sub" role="status">
          Contraseña blanqueada: la de {nombre} vuelve a ser la temporal y
          tendrá que elegir una nueva al ingresar. Avisale por un canal seguro,
          sin escribirle la contraseña.
        </span>
      )}

      <ConfirmDialog
        abierto={confirmar}
        titulo="Blanquear la contraseña"
        destructivo
        ocupado={enviando}
        confirmar="Blanquear"
        mensaje={`La contraseña de ${nombre} va a volver a ser la temporal (los últimos 4 dígitos de su DNI). Hay que comunicárselos a la persona por un canal seguro: al ingresar, el sistema le va a pedir que elija una contraseña nueva. Además se cierran las sesiones que tenga abiertas en otros equipos.`}
        onCancelar={() => setConfirmar(false)}
        onConfirmar={blanquear}
      />
    </span>
  );
}