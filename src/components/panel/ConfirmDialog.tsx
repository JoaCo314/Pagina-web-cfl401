"use client";

import { ReactNode, useEffect, useId, useRef } from "react";

/// Diálogo de confirmación propio del panel. Reemplaza a `window.confirm` /
/// `window.alert`, que bloquean el hilo principal y no se pueden estilizar ni
/// anunciar bien: acá el foco queda dentro del diálogo, Escape cierra y el
/// mensaje de éxito se muestra en línea en el componente que lo pidió.
export default function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  confirmar = "Confirmar",
  cancelar = "Cancelar",
  destructivo = false,
  ocupado = false,
  onConfirmar,
  onCancelar,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: ReactNode;
  confirmar?: string;
  cancelar?: string;
  destructivo?: boolean;
  ocupado?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const tituloId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Elemento que tenía el foco antes de abrir el diálogo (el botón que lo
  // llamó). Al cerrar se devuelve el foco a ese botón: si no, el navegador lo
  // pierde al desmontar el panel y quien navega con teclado queda en <body>.
  const focoAnteriorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierto) return;

    focoAnteriorRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    function onKeyDown(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        onCancelar();
        return;
      }
      if (evento.key !== "Tab" || !panel) return;

      const foco = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (foco.length === 0) return;

      const primero = foco[0];
      const ultimo = foco[foco.length - 1];
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Al desmontarse (confirmar o cancelar) el foco vuelve al disparador.
      const anterior = focoAnteriorRef.current;
      if (anterior && anterior.isConnected) {
        anterior.focus();
      }
    };
  }, [abierto, onCancelar]);

  if (!abierto) return null;

  return (
    <div className="dialogo-fondo" onMouseDown={onCancelar}>
      <div
        className="dialogo"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        ref={panelRef}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="dialogo-titulo" id={tituloId}>
          {titulo}
        </h2>
        <div className="dialogo-mensaje">{mensaje}</div>
        <div className="dialogo-acciones">
          <button
            type="button"
            className="btn-sm btn-ghost-dark"
            onClick={onCancelar}
            disabled={ocupado}
          >
            {cancelar}
          </button>
          <button
            type="button"
            className={`btn-sm ${destructivo ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirmar}
            disabled={ocupado}
          >
            {ocupado ? "Guardando…" : confirmar}
          </button>
        </div>
      </div>
    </div>
  );
}