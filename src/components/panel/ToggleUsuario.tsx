// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

/// Activa o desactiva una cuenta. El botón que dispara la operación vive en
/// el menú ⋮ de la fila (AccionesUsuario): acá queda la confirmación, el envío
/// y los avisos de error. `abierto` y `onCerrar` los controla el padre para
/// que el diálogo no se monte dentro del menú (si el menú se cierra, el
/// diálogo se caería con él).
export default function ToggleUsuario({
  usuarioId,
  nombre,
  activo,
  bloqueada = false,
  cursosAsignados = 0,
  abierto,
  onCerrar,
}: {
  usuarioId: number;
  nombre: string;
  activo: boolean;
  bloqueada?: boolean;
  cursosAsignados?: number;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Callback estable: ConfirmDialog re-ejecuta su efecto de foco cuando
  // cambian sus props, y con una función nueva en cada render el foco saltaba
  // al panel cada vez que cambiaba `enviando`.
  const cancelar = useCallback(() => {
    onCerrar();
  }, [onCerrar]);

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

      onCerrar();
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
    <>
      {/* El span vive en la celda (detrás del overlay) para anunciar el error
          y para que siga visible si la persona cancela el diálogo. */}
      <span className="form-error" role="alert" aria-live="polite">
        {error ?? ""}
      </span>

      <ConfirmDialog
        abierto={abierto}
        titulo={activo ? "Desactivar la cuenta" : "Reactivar la cuenta"}
        destructivo={activo}
        ocupado={enviando}
        confirmar={activo ? "Desactivar" : "Activar"}
        mensaje={
          <>
            {activo
              ? `${nombre} va a perder el acceso al panel y no podrá iniciar sesión hasta que se reactive la cuenta.${
                  cursosAsignados > 0
                    ? ` Quedan ${cursosAsignados} ${
                        cursosAsignados === 1
                          ? "curso asignado"
                          : "cursos asignados"
                      } sin docente activo: sacale la asignación o asignale otro docente para que no queden sin cubrir.`
                    : ""
                }`
              : bloqueada
                ? `${nombre} estaba bloqueado por demasiados intentos fallidos de inicio de sesión. Al reactivarlo va a poder volver a entrar al panel con su contraseña actual.`
                : `${nombre} va a poder volver a entrar al panel con su contraseña actual.`}
            {/* El error también se repite adentro del diálogo: afuera quedaría
                tapado por el fondo del ConfirmDialog. */}
            {error && <p className="form-error">{error}</p>}
          </>
        }
        onCancelar={cancelar}
        onConfirmar={alternar}
      />
    </>
  );
}
