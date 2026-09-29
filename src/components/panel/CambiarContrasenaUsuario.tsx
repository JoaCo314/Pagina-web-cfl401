"use client";

import { FormEvent, useState } from "react";

export default function CambiarContrasenaUsuario({
  usuarioId,
  nombre,
}: {
  usuarioId: number;
  nombre: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cerrar() {
    setAbierto(false);
    setPassword("");
    setError(null);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo actualizar la contraseña.");
        return;
      }

      cerrar();
      window.alert(`Contraseña de ${nombre} actualizada con éxito.`);
    } catch {
      setError("No se pudo actualizar la contraseña. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        className="btn-sm btn-ghost-dark"
        onClick={() => setAbierto(true)}
      >
        Cambiar contraseña
      </button>
    );
  }

  return (
    <form className="inline-mini-form" onSubmit={onSubmit} noValidate>
      <span className="td-sub">{nombre}</span>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nueva contraseña (mín. 8)"
        autoComplete="new-password"
        autoFocus
      />
      {error && <span className="form-error">{error}</span>}
      <button type="submit" className="btn-primary btn-sm" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar"}
      </button>
      <button
        type="button"
        className="btn-sm btn-ghost-dark"
        onClick={cerrar}
        disabled={enviando}
      >
        Cancelar
      </button>
    </form>
  );
}