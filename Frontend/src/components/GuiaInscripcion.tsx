"use client";

import { useEffect, useState } from "react";

type Bloque = { clave: string; titulo: string; contenido: string };

const ICONOS: Record<string, string> = {
  pasos: "📋",
  documentacion: "📄",
  requisitos: "✅",
  informacion_adicional: "ℹ️",
};

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
    return <p className="courses-empty">Cargando guía de inscripción…</p>;
  }

  return (
    <div className="guia-grid">
      {bloques.map((bloque) => (
        <article key={bloque.clave} className="guia-card">
          <div className="guia-icon">{ICONOS[bloque.clave] ?? "📘"}</div>
          <h3>{bloque.titulo}</h3>
          <p>{bloque.contenido}</p>
        </article>
      ))}
    </div>
  );
}