// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/// Campana de la cabecera del panel con la cantidad de avisos sin leer. El
/// contador se trae del servidor al montar y cada vez que cambia la ruta del
/// panel; además escucha el evento `notificaciones:cambio` que dispara la
/// propia vista de notificaciones al marcar algo como leído.
export default function CampanaNotificaciones() {
  const pathname = usePathname();
  const [sinLeer, setSinLeer] = useState(0);

  const cargar = useCallback(() => {
    fetch("/api/notificaciones", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ sinLeer?: number }>) : null))
      .then((data) => {
        if (data && typeof data.sinLeer === "number") {
          setSinLeer(data.sinLeer);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar, pathname]);

  useEffect(() => {
    function onCambio(e: Event) {
      const detalle = (e as CustomEvent<{ sinLeer?: number }>).detail;
      if (typeof detalle?.sinLeer === "number") setSinLeer(detalle.sinLeer);
      else cargar();
    }
    window.addEventListener("notificaciones:cambio", onCambio);
    return () => window.removeEventListener("notificaciones:cambio", onCambio);
  }, [cargar]);

  return (
    <Link
      href="/panel/notificaciones"
      className="panel-campana"
      aria-label={
        sinLeer > 0
          ? `Notificaciones, ${sinLeer} sin leer`
          : "Notificaciones"
      }
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {sinLeer > 0 && (
        <span className="panel-campana-badge" aria-hidden="true">
          {sinLeer > 9 ? "9+" : sinLeer}
        </span>
      )}
    </Link>
  );
}
