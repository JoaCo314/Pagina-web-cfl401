"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

export default function CambiarMiContrasena({ nombre }: { nombre: string }) {
  const router = useRouter();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

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
      const res = await fetchConTimeout("/api/auth/mi-contrasena", {
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
        esperaSegundos?: number;
      } | null;

      if (res.status === 429 && data?.esperaSegundos) {
        const minutos = Math.max(1, Math.ceil(data.esperaSegundos / 60));
        setError(
          `Demasiados intentos fallidos. Volvé a intentar en ${minutos} minuto${minutos > 1 ? "s" : ""}.`
        );
      } else {
        setError(data?.error ?? "No se pudo cambiar la contraseña.");
      }
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo cambiar la contraseña. Revisá tu conexión e intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function onSalir() {
    setSaliendo(true);
    try {
      await fetchConTimeout("/api/auth/logout", { method: "POST" });
    } catch {
      // Si el logout falla, seguimos a la pantalla de acceso: el panel igual
      // va a rebotar porque la contraseña sigue pendiente.
    }
    router.replace("/login");
    router.refresh();
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
          name="passwordActual"
          autoComplete="current-password"
          required
          maxLength={72}
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
        />
      </label>

      <label className="auth-field">
        <span>Contraseña nueva (mínimo 8 caracteres)</span>
        <input
          type="password"
          name="passwordNueva"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
        />
      </label>

      <label className="auth-field">
        <span>Repetí la contraseña nueva</span>
        <input
          type="password"
          name="repetir"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
        />
      </label>

      <p className="auth-error" role="alert" aria-live="assertive">
        {error ?? ""}
      </p>

      <button type="submit" className="auth-submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar contraseña"}
      </button>

      <p className="auth-note sin-seleccion">
        <button
          type="button"
          className="auth-submit-secondary"
          onClick={onSalir}
          disabled={enviando || saliendo}
        >
          {saliendo ? "Saliendo…" : "Salir de la cuenta"}
        </button>
      </p>
    </form>
  );
}