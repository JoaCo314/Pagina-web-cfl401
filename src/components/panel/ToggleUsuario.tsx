"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleUsuario({
  usuarioId,
  nombre,
  activo,
  esPropio,
}: {
  usuarioId: number;
  nombre: string;
  activo: boolean;
  esPropio: boolean;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  if (esPropio) {
    return <span className="td-sub">Tu cuenta</span>;
  }

  async function alternar() {
    const destino = activo
      ? `¿Desactivar a ${nombre}? Perderá el acceso al panel y no podrá iniciar sesión.`
      : `¿Reactivar a ${nombre}?`;
    if (!window.confirm(destino)) return;

    setEnviando(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !activo }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        window.alert(data?.error ?? "No se pudo actualizar el usuario.");
        return;
      }

      router.refresh();
    } catch {
      window.alert("No se pudo actualizar el usuario. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <button
      type="button"
      className="btn-sm btn-ghost-dark"
      onClick={alternar}
      disabled={enviando}
    >
      {enviando ? "Guardando…" : activo ? "Desactivar" : "Activar"}
    </button>
  );
}