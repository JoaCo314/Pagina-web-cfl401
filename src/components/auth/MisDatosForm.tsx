// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { esEmailValido, esTelefonoValido } from "@/lib/validaciones";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

type DatosIniciales = {
  email: string;
  telefono: string;
};

/// Edición de los datos de contacto de la cuenta propia: email y teléfono. El
/// nombre, apellido y DNI no se editan acá. El teléfono es solo para que el
/// centro se comunique con la persona: no se publica en el sitio.
export default function MisDatosForm({ inicial }: { inicial: DatosIniciales }) {
  const router = useRouter();
  const [email, setEmail] = useState(inicial.email);
  const [telefono, setTelefono] = useState(inicial.telefono);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const sinCambios =
    email.trim().toLowerCase() === inicial.email &&
    telefono.trim() === inicial.telefono;

  function validarFront(): string | null {
    if (!email.trim()) return "El email es obligatorio.";
    if (!esEmailValido(email.trim())) {
      return "El email no tiene un formato válido.";
    }
    if (telefono.trim() && !esTelefonoValido(telefono.trim())) {
      return "El teléfono no es válido. Usá solo números y, si querés, +, espacios, guiones o paréntesis.";
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
      const res = await fetchConTimeout("/api/auth/mis-datos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), telefono: telefono.trim() }),
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
        <p>Tu email y tu teléfono de contacto quedaron guardados.</p>
        <div className="form-actions">
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => {
              router.push("/panel");
              router.refresh();
            }}
          >
            Volver al panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="curso-form" onSubmit={onSubmit} noValidate>
      <label className="form-field form-field-full">
        <span>
          Email <strong>*</strong>
        </span>
        <input
          type="email"
          name="email"
          required
          maxLength={200}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="form-field form-field-full">
        <span>Teléfono de contacto</span>
        <input
          type="tel"
          name="telefono"
          maxLength={25}
          autoComplete="tel"
          placeholder="Ej.: +54 9 2284 12-3456"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
      </label>

      <p className="form-note form-field-full">
        El teléfono es solo para que el centro se comunique con vos: no se
        muestra en el sitio público.
      </p>

      <p className="form-error" role="alert" aria-live="assertive">
        {error ?? ""}
      </p>

      <div className="form-actions">
        <button type="submit" className="btn-primary btn-sm" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
