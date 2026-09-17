"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function EliminarCurso({
  cursoId,
  nombre,
  cantidadDocentes,
}: {
  cursoId: number;
  nombre: string;
  cantidadDocentes: number;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function cerrar() {
    if (enviando) return;
    setAbierto(false);
    setError(null);
  }

  async function onEliminar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const res = await fetch(`/api/cursos/${cursoId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAbierto(false);
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo eliminar el curso.");
    } catch {
      setError("No se pudo eliminar el curso. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="link-accion link-eliminar"
        onClick={() => setAbierto(true)}
      >
        Eliminar
      </button>

      {abierto && (
        <div className="modal-backdrop" role="presentation" onClick={cerrar}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="eliminar-curso-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="eliminar-curso-titulo" className="panel-title">
              Eliminar curso
            </h2>
            <p className="modal-texto">
              ¿Seguro que querés eliminar el curso{" "}
              <strong>{nombre}</strong>? Esta acción no se puede deshacer.
            </p>

            {cantidadDocentes > 0 && (
              <p className="modal-aviso">
                Este curso tiene{" "}
                <strong>
                  {cantidadDocentes}{" "}
                  {cantidadDocentes === 1
                    ? "docente asignado"
                    : "docentes asignados"}
                </strong>
                . Al eliminarlo se quitarán esas asignaciones.
              </p>
            )}

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={onEliminar}
                disabled={enviando}
              >
                {enviando ? "Eliminando…" : "Sí, eliminar"}
              </button>
              <button
                type="button"
                className="btn-ghost-dark"
                onClick={cerrar}
                disabled={enviando}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}