// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

/// Eliminación definitiva de una cuenta. Solo se ofrece cuando la cuenta ya
/// está desactivada (la API lo vuelve a exigir) y solo para el Administrador.
/// El botón que dispara la operación vive en el menú ⋮ de la fila
/// (AccionesUsuario): acá queda la confirmación, el envío y los avisos de
/// error. `abierto` y `onCerrar` los controla el padre para que el diálogo no
/// se monte dentro del menú (si el menú se cierra, el diálogo se caería con
/// él).
export default function EliminarUsuario({
  usuarioId,
  nombre,
  cursosAsignados = 0,
  abierto,
  onCerrar,
}: {
  usuarioId: number;
  nombre: string;
  cursosAsignados?: number;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Callback estable: ConfirmDialog re-ejecuta su efecto de foco cuando
  // cambian sus props, y con una función nueva en cada render el foco saltaba
  // al panel cada vez que cambiaba `enviando`.
  const cancelar = useCallback(() => {
    onCerrar();
  }, [onCerrar]);

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
        return;
      }

      onCerrar();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo eliminar la cuenta. Revisá tu conexión e intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  const conCursos = cursosAsignados > 0;

  return (
    <>
      {/* El span vive en la celda (detrás del overlay) para anunciar el error
          y para que siga visible si la persona cancela el diálogo. */}
      <span className="form-error" role="alert" aria-live="polite">
        {error ?? ""}
      </span>

      <ConfirmDialog
        abierto={abierto}
        titulo="Eliminar la cuenta"
        destructivo
        ocupado={enviando}
        confirmar="Eliminar definitivamente"
        mensaje={
          <>
            {conCursos
              ? `${nombre} todavía tiene ${cursosAsignados} ${
                  cursosAsignados === 1
                    ? "curso asignado"
                    : "cursos asignados"
                }. La cuenta no se va a poder eliminar hasta que reasignes esos cursos a otro docente.`
              : `Se va a eliminar la cuenta de ${nombre} de forma definitiva. No se puede deshacer: si la persona vuelve al centro, habrá que crearle una cuenta nueva.`}
            {/* El error también se repite adentro del diálogo: afuera quedaría
                tapado por el fondo del ConfirmDialog. */}
            {error && <p className="form-error">{error}</p>}
          </>
        }
        onCancelar={cancelar}
        onConfirmar={eliminar}
      />
    </>
  );
}
