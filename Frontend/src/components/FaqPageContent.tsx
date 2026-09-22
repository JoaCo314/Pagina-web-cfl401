"use client";

import { useEffect, useState } from "react";
import FaqList, { type FaqCategoria } from "@/components/FaqList";

export default function FaqPageContent() {
  const [categorias, setCategorias] = useState<FaqCategoria[] | null>(null);

  useEffect(() => {
    fetch("/api/preguntas-frecuentes")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCategorias(data.categorias))
      .catch(() => setCategorias([]));
  }, []);

  if (categorias === null) {
    return <p className="courses-empty">Cargando preguntas frecuentes…</p>;
  }

  return categorias.length > 0 ? <FaqList categorias={categorias} /> : null;
}
