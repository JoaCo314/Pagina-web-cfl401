// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { esEmailValido, REGEX_DNI } from "@/lib/validaciones";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

type DatosUsuario = {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
};

/// Edición de los datos de identidad de un usuario (RF-15): nombre, apellido,
/// DNI y email. El rol no se edita acá (lo define el alta) y la contraseña se
/// blanquea desde el listado.
export default function EditarUsuarioForm({
  usuarioId,
  inicial,
}: {
  usuarioId: number;
  inicial: DatosUsuario;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(inicial.nombre);
  const [apellido, setApellido] = useState(inicial.apellido);
  const [dni, setDni] = useState(inicial.dni);
  const [email, setEmail] = useState(inicial.email);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const sinCambios =
    nombre.trim() === inicial.nombre &&
    apellido.trim() === inicial.apellido &&
    dni.trim() === inicial.dni &&
    email.trim().toLowerCase() === inicial.email;

  function validarFront(): string | null {
    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (!apellido.trim()) return "El apellido es obligatorio.";
    if (!REGEX_DNI.test(dni.trim())) {
      return "El DNI debe tener 7 u 8 dígitos.";
    }
    if (!esEmailValido(email.trim())) {
      return "El email no tiene un formato válido.";
    }
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

    if (sinCambios) {
      setError("No modificaste ningún dato.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetchConTimeout(`/api/admin/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          dni: dni.trim(),
          email: email.trim(),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudieron guardar los cambios.");
        return;
      }

      setGuardado(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudieron guardar los cambios. Revisá tu conexión e intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (guardado) {
    return (
      <div className="panel-nota-ok sin-seleccion">
        <h2 className="panel-subtitle">Datos actualizados</h2>
        <p>
          Los datos de <strong>{nombre.trim()} {apellido.trim()}</strong>{" "}
          quedaron guardados.
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => {
              router.push("/panel/usuarios");
              router.refresh();
            }}
          >
            Volver al listado
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
          required
          maxLength={100}
          autoComplete="off"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
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
        />
      </label>

      <p className="form-note form-field-full">
        Al cambiar el DNI de una cuenta que todavía tiene la contraseña
        temporal, esa contraseña se recalcula con los últimos 4 dígitos del DNI
        nuevo.
      </p>

      <p className="form-error" role="alert" aria-live="assertive">
        {error ?? ""}
      </p>

      <div className="form-actions">
        <button type="submit" className="btn-primary btn-sm" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar cambios"}
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
