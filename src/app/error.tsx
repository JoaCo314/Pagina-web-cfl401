"use client";

import { useEffect } from "react";
import Link from "next/link";
import SiteHeaderCliente from "@/components/SiteHeaderCliente";

/// Boundary de error de todo el sitio (páginas públicas). Reemplaza el
/// pantallazo del dev server por un mensaje claro, diseño institucional y botón de reintento.
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
    <>
      <SiteHeaderCliente
        sesionIniciada={false}
        logoUrl="/cfl401azul_logo.jpg"
        logoAlt="CFL 401 Azul"
      />

      <div className="page-header" id="contenido" tabIndex={-1} style={{ minHeight: "65vh", display: "flex", alignItems: "center" }}>
        <div className="wrap" style={{ width: "100%" }}>
          <div className="not-found">
            <h1 className="not-found-codigo">500</h1>
            <h2 className="not-found-titulo">Ups, algo salió mal</h2>
            <p className="not-found-texto">
              Ocurrió un error inesperado al conectar con el servicio. Podés
              reintentar la carga o regresar al inicio.
            </p>
            <div className="not-found-acciones">
              <button type="button" className="btn-primary" onClick={reset}>
                Reintentar
              </button>
              <Link href="/" className="btn-ghost">
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
