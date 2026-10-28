"use client";

import { useEffect } from "react";

/// Última red de seguridad: atrapa errores que rompan el layout raíz y
/// por eso necesita su propio <html>/<body>.
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
      <head>
        <title>Error del servicio — CFL 401 Azul</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          background: "#122a45",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 520 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                opacity: 0.9,
                lineHeight: 1,
                marginBottom: 16,
                letterSpacing: "-0.02em",
              }}
            >
              500
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
              Ups, algo salió mal
            </h1>
            <p style={{ fontSize: 16, opacity: 0.85, lineHeight: 1.5, marginBottom: 24 }}>
              Ocurrió un error inesperado al conectar con el servidor. Recargá la página para intentar de nuevo.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "12px 24px",
                borderRadius: 6,
                border: "none",
                background: "#2a6ea3",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 600,
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
