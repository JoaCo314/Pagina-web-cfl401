"use client";

import { useEffect } from "react";
import Link from "next/link";

/// Boundary de error del panel: ante un fallo inesperado muestra un mensaje
/// recuperable (recargar) y un enlace al inicio, en lugar de dejar una página
/// rota o un pantallazo de error del dev server.
export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Panel] Error inesperado:", error);
  }, [error]);

  return (
    <div className="panel">
      <main className="wrap panel-main">
        <section className="panel-pagina">
          <div className="panel-pagina-head">
            <h1>Algo no funcionó</h1>
            <p>
              Ocurrió un error inesperado en esta sección. Recargá e intentá de
              nuevo; si persiste, avisale al equipo de sistemas.
            </p>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-primary btn-sm" onClick={reset}>
              Reintentar
            </button>
            <Link href="/panel" className="btn-secondary btn-sm">
              Ir al resumen
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}