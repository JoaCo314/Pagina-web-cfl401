"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

export default function ToggleUsuario({
  usuarioId,
  nombre,
  activo,
  esPropio,
  cursosAsignados = 0,
}: {
  usuarioId: number;
  nombre: string;
  activo: boolean;
  esPropio: boolean;
  cursosAsignados?: number;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (esPropio) {
    return <span className="td-sub">Tu cuenta</span>;
  }

  async function alternar() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetchConTimeout(`/api/admin/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !activo }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo actualizar el usuario.");
        return;
      }

      setConfirmar(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo actualizar el usuario. Revisá tu conexión e intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <span className="acciones-usuario">
      <button
        type="button"
        className="btn-sm btn-ghost-dark"
        onClick={() => {
          setError(null);
          setConfirmar(true);
        }}
        disabled={enviando}
      >
        {enviando ? "Guardando…" : activo ? "Desactivar" : "Activar"}
      </button>
      <span className="form-error" role="alert" aria-live="polite">
        {error ?? ""}
      </span>

      <ConfirmDialog
        abierto={confirmar}
        titulo={activo ? "Desactivar la cuenta" : "Reactivar la cuenta"}
        destructivo={activo}
        ocupado={enviando}
        confirmar={activo ? "Desactivar" : "Activar"}
        mensaje={
          activo
            ? `${nombre} va a perder el acceso al panel y no podrá iniciar sesión hasta que se reactive la cuenta.${
                cursosAsignados > 0
                  ? ` Quedan ${cursosAsignados} ${
                      cursosAsignados === 1
                        ? "curso asignado"
                        : "cursos asignados"
                    } sin docente activo: sacale la asignación o asignale otro docente para que no queden sin cubrir.`
                  : ""
              }`
            : `${nombre} va a poder volver a entrar al panel con su contraseña actual.`
        }
        onCancelar={() => setConfirmar(false)}
        onConfirmar={alternar}
      />
    </span>
  );
}