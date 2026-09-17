"use client";

import { useEffect, useState } from "react";
import NoticiaCard from "@/components/NoticiaCard";
import type { Noticia } from "@/lib/noticiaUtils";

export default function NoticiasList() {
  const [noticias, setNoticias] = useState<Noticia[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/noticias")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))
      )
      .then((data) => setNoticias(data.noticias as Noticia[]))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error desconocido")
      );
  }, []);

  return (
    <section className="noticias-section">
      <div className="wrap">
        {error ? (
          <p className="courses-empty">
            No se pudieron cargar las noticias. Intentá de nuevo en unos
            minutos.
          </p>
        ) : noticias === null ? (
          <p className="courses-empty">Cargando noticias…</p>
        ) : noticias.length === 0 ? (
          <p className="courses-empty">
            Todavía no hay noticias publicadas. Volvé a visitarnos pronto.
          </p>
        ) : (
          <div className="noticias-list">
            {noticias.map((noticia) => (
              <NoticiaCard key={noticia.id} noticia={noticia} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
