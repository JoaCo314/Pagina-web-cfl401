// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

/// Eliminación definitiva de una cuenta. Solo se ofrece cuando la cuenta ya
/// está desactivada (la API lo vuelve a exigir) y solo para el Administrador.
export default function EliminarUsuario({
  usuarioId,
  nombre,
  cursosAsignados = 0,
}: {
  usuarioId: number;
  nombre: string;
  cursosAsignados?: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  async function eliminar() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetchConTimeout(`/api/admin/usuarios/${usuarioId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo eliminar la cuenta.");
        setConfirmar(false);
        return;
      }

      setConfirmar(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo eliminar la cuenta. Revisá tu conexión e intentá nuevamente."
      );
      setConfirmar(false);
    } finally {
      setEnviando(false);
    }
  }

  const conCursos = cursosAsignados > 0;

  return (
    <span className="acciones-usuario">
      <button
        type="button"
        className="link-accion link-accion-alerta"
        onClick={() => {
          setError(null);
          setConfirmar(true);
        }}
        disabled={enviando}
      >
        {enviando ? "Eliminando…" : "Eliminar"}
      </button>
      <span className="form-error" role="alert" aria-live="polite">
        {error ?? ""}
      </span>

      <ConfirmDialog
        abierto={confirmar}
        titulo="Eliminar la cuenta"
        destructivo
        ocupado={enviando}
        confirmar="Eliminar definitivamente"
        mensaje={
          conCursos
            ? `${nombre} todavía tiene ${cursosAsignados} ${
                cursosAsignados === 1
                  ? "curso asignado"
                  : "cursos asignados"
              }. La cuenta no se va a poder eliminar hasta que reasignes esos cursos a otro docente.`
            : `Se va a eliminar la cuenta de ${nombre} de forma definitiva. No se puede deshacer: si la persona vuelve al centro, habrá que crearle una cuenta nueva.`
        }
        onCancelar={() => setConfirmar(false)}
        onConfirmar={eliminar}
      />
    </span>
  );
}
