// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

/// Blanquea la contraseña de una cuenta (vuelve a ser la temporal). El botón
/// que dispara la operación vive en el menú ⋮ de la fila (AccionesUsuario):
/// acá queda la confirmación, el envío y los avisos de error. `abierto` y
/// `onCerrar` los controla el padre para que el diálogo no se monte dentro del
/// menú (si el menú se cierra, el diálogo se caería con él).
export default function BlanquearContrasena({
  usuarioId,
  nombre,
  abierto,
  onCerrar,
}: {
  usuarioId: number;
  nombre: string;
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

  async function blanquear() {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetchConTimeout(`/api/admin/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "blanquearContrasena" }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo blanquear la contraseña.");
        return;
      }

      onCerrar();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo blanquear la contraseña. Revisá tu conexión e intentá nuevamente."
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
        titulo="Blanquear la contraseña"
        destructivo
        ocupado={enviando}
        confirmar="Blanquear"
        mensaje={
          <>
            <p>
              Se restablecerá la contraseña de <strong>{nombre}</strong> a la clave temporal inicial (<strong>los últimos 4 dígitos de su DNI</strong>).
            </p>
            <p>
              Al iniciar sesión, el sistema le solicitará definir una nueva contraseña y se cerrarán las sesiones activas en otros dispositivos.
            </p>
            <div className="dialogo-nota">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Recordá comunicarle la clave temporal por un canal seguro.</span>
            </div>
            {/* El error también se repite adentro del diálogo: afuera quedaría
                tapado por el fondo del ConfirmDialog. */}
            {error && <p className="form-error">{error}</p>}
          </>
        }
        onCancelar={cancelar}
        onConfirmar={blanquear}
      />
    </>
  );
}
