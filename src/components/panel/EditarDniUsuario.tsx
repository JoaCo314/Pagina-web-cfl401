"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { REGEX_DNI } from "@/lib/validaciones";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

const MENSAJE_RECALCULO =
  "El DNI está corregido y la contraseña temporal volvió a calcularse con los últimos 4 dígitos del DNI nuevo.";

/// Edición del DNI desde la fila del listado. La API rehace la contraseña
/// temporal cuando la cuenta todavía tiene una pendiente, para que nunca quede
/// una contraseña que la persona no conoce.
export default function EditarDniUsuario({
  usuarioId,
  nombre,
  dni,
  tieneTemporal,
}: {
  usuarioId: number;
  nombre: string;
  dni: string;
  tieneTemporal: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(dni);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);

  // El mensaje de éxito vive dentro de una celda de la tabla: si queda hasta
  // recargar la página agranda la fila durante toda la sesión. Se va solo.
  useEffect(() => {
    if (!listo) return;
    const t = setTimeout(() => setListo(null), 6000);
    return () => clearTimeout(t);
  }, [listo]);

  function abrir() {
    setValor(dni);
    setError(null);
    setListo(null);
    setEditando(true);
  }

  function cancelar() {
    setEditando(false);
    setError(null);
  }

  async function guardar() {
    const nuevo = valor.trim();
    if (!REGEX_DNI.test(nuevo)) {
      setError("El DNI debe tener 7 u 8 dígitos.");
      return;
    }
    if (nuevo === dni) {
      setEditando(false);
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      const res = await fetchConTimeout(`/api/admin/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: nuevo }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo corregir el DNI.");
        return;
      }

      setEditando(false);
      setListo(
        tieneTemporal
          ? MENSAJE_RECALCULO
          : `DNI de ${nombre} corregido.`
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo corregir el DNI. Revisá tu conexión e intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (editando) {
    return (
      <span className="acciones-usuario dni-editor">
        <label className="dni-campo">
          <span className="td-sub">DNI de {nombre}</span>
          <input
            className="input-sm"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `dni-error-${usuarioId}` : undefined}
            disabled={enviando}
          />
        </label>
        <span className="acciones-usuario-fila">
          <button
            type="button"
            className="link-accion"
            onClick={guardar}
            disabled={enviando}
          >
            {enviando ? "Guardando…" : "Guardar DNI"}
          </button>
          <button
            type="button"
            className="link-accion link-accion-secundario"
            onClick={cancelar}
            disabled={enviando}
          >
            Cancelar
          </button>
        </span>
        <span
          className="form-error"
          id={`dni-error-${usuarioId}`}
          role="alert"
          aria-live="polite"
        >
          {error ?? ""}
        </span>
      </span>
    );
  }

  return (
    <span className="acciones-usuario">
      <span className="dni-valor">{dni}</span>
      <button
        type="button"
        className="link-accion"
        onClick={abrir}
        disabled={enviando}
        aria-label={`Editar DNI de ${nombre}`}
      >
        Editar
      </button>
      <span className="form-error" role="alert" aria-live="polite">
        {error ?? ""}
      </span>
      {listo && (
        <span className="td-sub" role="status">
          {listo}
        </span>
      )}
    </span>
  );
}