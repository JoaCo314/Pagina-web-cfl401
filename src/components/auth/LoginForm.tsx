// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

export default function LoginForm() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const res = await fetchConTimeout("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador, password }),
      });

      if (res.ok) {
        const data = (await res.json().catch(() => null)) as {
          user?: { debeCambiarContrasena?: boolean };
        } | null;
        router.replace(
          data?.user?.debeCambiarContrasena
            ? "/panel/cambiar-mi-contrasena"
            : "/panel"
        );
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo iniciar sesión.");
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo iniciar sesión. Intentá de nuevo en unos minutos."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label className="auth-field">
        <span>Correo electrónico o DNI</span>
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input
            type="text"
            name="identificador"
            autoComplete="username"
            placeholder="ejemplo@cfl401.edu.ar o DNI"
            required
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
          />
        </div>
      </label>

      <label className="auth-field">
        <span>Contraseña</span>
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
            type={mostrarPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Tu contraseña personal"
            className="has-toggle"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="auth-toggle-pwd"
            onClick={() => setMostrarPassword((prev) => !prev)}
            aria-label={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
            title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {mostrarPassword ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </label>

      {/* Siempre en el DOM (igual que CambiarMiContrasena): sin error el CSS
          `.auth-error:empty` lo oculta, y con role/aria-live el lector de
          pantalla anuncia "Credenciales inválidas" apenas aparece. */}
      <p className="auth-error" role="alert" aria-live="polite">
        {error ?? ""}
      </p>

      <button type="submit" className="auth-submit" disabled={enviando}>
        {enviando ? (
          <>
            <span className="auth-submit-spinner" aria-hidden="true" />
            Ingresando al sistema…
          </>
        ) : (
          <>
            Ingresar al panel
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}