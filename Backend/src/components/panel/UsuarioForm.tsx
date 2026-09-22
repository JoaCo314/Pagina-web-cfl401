"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function UsuarioForm({
  rolesPermitidos,
}: {
  rolesPermitidos: string[];
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState(rolesPermitidos[0] ?? "");
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validarFront(): string | null {
    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (!apellido.trim()) return "El apellido es obligatorio.";
    if (!email.trim()) return "El email es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "El email no tiene un formato válido.";
    }
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres.";
    }
    if (!rol) return "Seleccioná un rol.";
    return null;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const errorForm = validarFront();
    if (errorForm) {
      setError(errorForm);
      return;
    }

    setEnviando(true);
    try {
      const body = JSON.stringify({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        password,
        rol,
        activo,
      });

      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        router.push("/panel/usuarios");
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo crear el usuario.");
    } catch {
      setError("No se pudo crear el usuario. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="curso-form" onSubmit={onSubmit} noValidate>
      <label className="form-field">
        <span>
          Nombre <strong>*</strong>
        </span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Ana"
        />
      </label>

      <label className="form-field">
        <span>
          Apellido <strong>*</strong>
        </span>
        <input
          type="text"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          placeholder="Ej: Martínez"
        />
      </label>

      <label className="form-field form-field-full">
        <span>
          Email <strong>*</strong>
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ej: ana.martinez@cfl401.edu.ar"
        />
      </label>

      <label className="form-field">
        <span>
          Contraseña <strong>*</strong> (mínimo 8 caracteres)
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </label>

      <label className="form-field">
        <span>
          Rol <strong>*</strong>
        </span>
        <select value={rol} onChange={(e) => setRol(e.target.value)}>
          {rolesPermitidos.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field form-field-full form-toggle">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
        />
        <span>Cuenta activa (puede iniciar sesión)</span>
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary btn-sm" disabled={enviando}>
          {enviando ? "Creando…" : "Crear usuario"}
        </button>
        <a
          href="/panel/usuarios"
          className="btn-ghost-dark"
          onClick={(e) => {
            e.preventDefault();
            router.push("/panel/usuarios");
          }}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}