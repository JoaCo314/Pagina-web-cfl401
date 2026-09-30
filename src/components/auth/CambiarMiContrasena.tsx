"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CambiarMiContrasena({ nombre }: { nombre: string }) {
  const router = useRouter();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!passwordActual) {
      setError("Ingresá tu contraseña temporal.");
      return;
    }
    if (passwordNueva.length < 8) {
      setError("La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (passwordNueva === passwordActual) {
      setError("La contraseña nueva debe ser distinta de la actual.");
      return;
    }
    if (passwordNueva !== repetir) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/auth/mi-contrasena", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordActual, passwordNueva }),
      });

      if (res.ok) {
        router.replace("/panel");
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo cambiar la contraseña.");
    } catch {
      setError("No se pudo cambiar la contraseña. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <p className="auth-note sin-seleccion">
        Hola {nombre}: para seguir usando el panel necesitás definir una
        contraseña propia. Usá la contraseña temporal que te entregaron y elegí
        una nueva.
      </p>

      <label className="auth-field">
        <span>Contraseña temporal (actual)</span>
        <input
          type="password"
          autoComplete="current-password"
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
        />
      </label>

      <label className="auth-field">
        <span>Contraseña nueva (mínimo 8 caracteres)</span>
        <input
          type="password"
          autoComplete="new-password"
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
        />
      </label>

      <label className="auth-field">
        <span>Repetí la contraseña nueva</span>
        <input
          type="password"
          autoComplete="new-password"
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
        />
      </label>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="auth-submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}