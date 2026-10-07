"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ email, password }),
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
        <span>Correo electrónico</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="auth-field">
        <span>Contraseña</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {/* Siempre en el DOM (igual que CambiarMiContrasena): sin error el CSS
          `.auth-error:empty` lo oculta, y con role/aria-live el lector de
          pantalla anuncia "Credenciales inválidas" apenas aparece. */}
      <p className="auth-error" role="alert" aria-live="polite">
        {error ?? ""}
      </p>

      <button type="submit" className="auth-submit" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}