"use client";

import { useEffect } from "react";
import Link from "next/link";

/// Boundary de error de todo el sitio (páginas públicas). Reemplaza el
/// pantallazo del dev server por un mensaje claro y el botón de reintento.
export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App] Error inesperado:", error);
  }, [error]);

  return (
    <main className="wrap" style={{ padding: "80px 20px", textAlign: "center" }}>
      <h1>Ups, algo salió mal</h1>
      <p>
        Ocurrió un error inesperado al cargar esta página. Recargá e intentá de
        nuevo.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button type="button" className="btn-primary" onClick={reset}>
          Reintentar
        </button>
        <Link href="/" className="btn-secondary">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}