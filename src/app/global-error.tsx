"use client";

import { useEffect } from "react";

/// Última red de seguridad: atrapa errores que rompan el layout raíz (que
/// `error.tsx` no alcanza) y por eso necesita su propio <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App] Error fatal:", error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>
              Ups, algo salió mal
            </h1>
            <p style={{ marginBottom: 20 }}>
              Ocurrió un error inesperado. Recargá la página para intentar de
              nuevo.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                background: "#1f4d8f",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}