"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

export default function CambiarMiContrasena({ nombre }: { nombre: string }) {
  const router = useRouter();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarRepetir, setMostrarRepetir] = useState(false);
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
      <div className="auth-note sin-seleccion">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="auth-note-icon"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          Hola <strong>{nombre}</strong>: para seguir usando el panel necesitás definir una contraseña propia. Usá la contraseña temporal que te entregaron y elegí una nueva.
        </span>
      </div>

      <label className="auth-field">
        <span>Contraseña temporal (actual)</span>
        <div className="auth-input-wrapper">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="auth-input-icon"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type={mostrarActual ? "text" : "password"}
            name="passwordActual"
            autoComplete="current-password"
            className="has-toggle"
            required
            maxLength={72}
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
          />
          <button
            type="button"
            className="auth-toggle-pwd"
            onClick={() => setMostrarActual((prev) => !prev)}
            aria-label={mostrarActual ? "Ocultar contraseña" : "Ver contraseña"}
            title={mostrarActual ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {mostrarActual ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </label>

      <label className="auth-field">
        <span>Contraseña nueva (mínimo 8 caracteres)</span>
        <div className="auth-input-wrapper">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="auth-input-icon"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type={mostrarNueva ? "text" : "password"}
            name="passwordNueva"
            autoComplete="new-password"
            className="has-toggle"
            required
            minLength={8}
            maxLength={72}
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
          />
          <button
            type="button"
            className="auth-toggle-pwd"
            onClick={() => setMostrarNueva((prev) => !prev)}
            aria-label={mostrarNueva ? "Ocultar contraseña" : "Ver contraseña"}
            title={mostrarNueva ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {mostrarNueva ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </label>

      <label className="auth-field">
        <span>Repetí la contraseña nueva</span>
        <div className="auth-input-wrapper">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="auth-input-icon"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type={mostrarRepetir ? "text" : "password"}
            name="repetir"
            autoComplete="new-password"
            className="has-toggle"
            required
            minLength={8}
            maxLength={72}
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
          />
          <button
            type="button"
            className="auth-toggle-pwd"
            onClick={() => setMostrarRepetir((prev) => !prev)}
            aria-label={mostrarRepetir ? "Ocultar contraseña" : "Ver contraseña"}
            title={mostrarRepetir ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {mostrarRepetir ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </label>

      <p className="auth-error" role="alert" aria-live="assertive">
        {error ?? ""}
      </p>

      <button type="submit" className="auth-submit" disabled={enviando}>
        {enviando ? "Guardando contraseña…" : "Guardar contraseña"}
      </button>

      <button
        type="button"
        className="auth-submit-secondary"
        onClick={onSalir}
        disabled={enviando || saliendo}
      >
        {saliendo ? "Cerrando sesión…" : "Salir de la cuenta"}
      </button>
    </form>
  );
}