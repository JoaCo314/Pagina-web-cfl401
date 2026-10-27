"use client";

import { useEffect, useState } from "react";
import HtmlEnriquecido from "@/components/HtmlEnriquecido";

type Bloque = {
  clave: string;
  titulo: string;
  contenido: string;
  contenidoHtml: string | null;
};

function IconoGuia({ clave }: { clave: string }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (clave) {
    case "pasos":
      return (
        <svg {...props}>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      );
    case "documentacion":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case "requisitos":
      return (
        <svg {...props}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case "informacion_adicional":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
  }
}

export default function GuiaInscripcion() {
  const [bloques, setBloques] = useState<Bloque[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/guia-inscripcion")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))
      )
      .then((data) => setBloques(data.contenidos as Bloque[]))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <p className="courses-empty">
        La guía de inscripción no está disponible por el momento. Intentá de
        nuevo en unos minutos.
      </p>
    );
  }

  if (bloques === null) {
    return (
      <>
        <div className="guia-grid" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="guia-card skeleton-tarjeta">
              <div className="skeleton skeleton-icono" />
              <div className="skeleton skeleton-linea media" />
              <div className="skeleton skeleton-linea" />
              <div className="skeleton skeleton-linea" />
              <div className="skeleton skeleton-linea corta" />
            </div>
          ))}
        </div>
        <p className="sr-only" role="status">
          Cargando guía de inscripción…
        </p>
      </>
    );
  }

  return (
    <div className="guia-grid">
      {bloques.map((bloque, index) => (
        <article key={bloque.clave} className="guia-card">
          <div className="guia-card-top">
            <div className="guia-icon">
              <IconoGuia clave={bloque.clave} />
            </div>
            <span className="guia-step-badge">Paso {index + 1}</span>
          </div>
          <h3>{bloque.titulo}</h3>
          <HtmlEnriquecido
            html={bloque.contenidoHtml}
            textoPlano={bloque.contenido}
          />
        </article>
      ))}
    </div>
  );
}
