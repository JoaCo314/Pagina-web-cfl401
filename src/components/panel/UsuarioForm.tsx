"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { esEmailValido, REGEX_DNI } from "@/lib/validaciones";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

export default function UsuarioForm({
  rolesPermitidos,
  puedeVerListado,
}: {
  rolesPermitidos: string[];
  puedeVerListado: boolean;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState(rolesPermitidos[0] ?? "");
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState<{ nombre: string } | null>(null);
  // El foco vuelve al primer campo al "Crear otro": si no, el teclado queda
  // parado en un botón que ya no existe.
  const primerCampoRef = useRef<HTMLInputElement>(null);

  function validarFront(): string | null {
    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (!apellido.trim()) return "El apellido es obligatorio.";
    if (!dni.trim()) return "El DNI es obligatorio.";
    if (!REGEX_DNI.test(dni.trim())) {
      return "El DNI debe tener 7 u 8 dígitos.";
    }
    if (!email.trim()) return "El email es obligatorio.";
    if (!esEmailValido(email)) {
      return "El email no tiene un formato válido.";
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
        dni: dni.trim(),
        email: email.trim(),
        rol,
        activo,
      });

      const res = await fetchConTimeout("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        setCreado({ nombre: `${nombre.trim()} ${apellido.trim()}` });
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo crear el usuario.");
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo crear el usuario. Revisá tu conexión e intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (creado) {
    return (
      <div className="panel-nota-ok sin-seleccion">
        <h2 className="panel-subtitle">Cuenta creada</h2>
        <p>
          La cuenta de <strong>{creado.nombre}</strong> quedó creada. La
          contraseña inicial son los <strong>últimos 4 dígitos de su DNI</strong>{" "}
          (columna DNI del listado): comunicáselos para que pueda ingresar.
        </p>
        <p className="form-note">
          Al entrar al panel, el sistema le va a pedir que cambie esa contraseña
          temporal por una propia. No se muestra ninguna contraseña en pantalla.
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => {
              router.push(puedeVerListado ? "/panel/usuarios" : "/panel");
              router.refresh();
            }}
          >
            {puedeVerListado ? "Ir al listado" : "Volver al panel"}
          </button>
          <button
            type="button"
            className="btn-ghost-dark btn-sm"
            onClick={() => {
              // "Crear otro" tiene que volver el formulario al estado inicial
              // completo: si quedan el rol y el activo del alta anterior, la
              // cuenta siguiente se crea sin querer con esos valores.
              setCreado(null);
              setNombre("");
              setApellido("");
              setDni("");
              setEmail("");
              setRol(rolesPermitidos[0] ?? "");
              setActivo(true);
              setError(null);
              primerCampoRef.current?.focus();
            }}
          >
            Crear otro
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="curso-form" onSubmit={onSubmit} noValidate>
      <label className="form-field">
        <span>
          Nombre <strong>*</strong>
        </span>
        <input
          type="text"
          name="nombre"
          ref={primerCampoRef}
          required
          maxLength={100}
          autoComplete="off"
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
          name="apellido"
          required
          maxLength={100}
          autoComplete="off"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          placeholder="Ej: Martínez"
        />
      </label>

      <label className="form-field">
        <span>
          DNI <strong>*</strong> (7 u 8 dígitos, sin puntos)
        </span>
        <input
          type="text"
          name="dni"
          inputMode="numeric"
          required
          maxLength={8}
          autoComplete="off"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          placeholder="Ej: 30123456"
        />
      </label>

      <label className="form-field form-field-full">
        <span>
          Email <strong>*</strong>
        </span>
        <input
          type="email"
          name="email"
          required
          maxLength={200}
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ej: ana.martinez@cfl401.edu.ar"
        />
      </label>

      <p className="form-note form-field-full">
        No se define una contraseña: la inicial son los últimos 4 dígitos del
        DNI y la persona deberá cambiarla al ingresar por primera vez.
      </p>

      <label className="form-field">
        <span>
          Rol <strong>*</strong>
        </span>
        <select
          name="rol"
          required
          value={rol}
          onChange={(e) => setRol(e.target.value)}
        >
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

      <p className="form-error" role="alert" aria-live="assertive">
        {error ?? ""}
      </p>

      <div className="form-actions">
        <button type="submit" className="btn-primary btn-sm" disabled={enviando}>
          {enviando ? "Creando…" : "Crear usuario"}
        </button>
        <a
          href={puedeVerListado ? "/panel/usuarios" : "/panel"}
          className="btn-ghost-dark"
          onClick={(e) => {
            e.preventDefault();
            router.push(puedeVerListado ? "/panel/usuarios" : "/panel");
          }}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}