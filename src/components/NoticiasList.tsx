"use client";

import { useCallback, useEffect, useState } from "react";
import NoticiaCard from "@/components/NoticiaCard";
import type { Noticia } from "@/lib/noticiaUtils";

const POR_PAGINA = 12;

type RespuestaNoticias = {
  noticias: Noticia[];
  total: number;
  porPagina: number;
  pagina: number;
};

function traerPagina(pagina: number): Promise<RespuestaNoticias> {
  return fetch(`/api/noticias?pagina=${pagina}&porPagina=${POR_PAGINA}`).then(
    (res) => {
      if (!res.ok) return Promise.reject(new Error(`HTTP ${res.status}`));
      return res.json() as Promise<RespuestaNoticias>;
    }
  );
}

function hayMasPaginas(pagina: number, data: RespuestaNoticias): boolean {
  return data.noticias.length > 0 && pagina * data.porPagina < data.total;
}

export default function NoticiasList() {
  const [noticias, setNoticias] = useState<Noticia[] | null>(null);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [hayMas, setHayMas] = useState(false);

  // Primera página: solo se toca estado dentro de los callbacks de la promesa
  // (nunca sincrónicamente en el cuerpo del efecto).
  useEffect(() => {
    let cancelado = false;
    traerPagina(1)
      .then((data) => {
        if (cancelado) return;
        setNoticias(data.noticias);
        setHayMas(hayMasPaginas(1, data));
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const verMas = useCallback(() => {
    const siguiente = pagina + 1;
    setCargando(true);
    traerPagina(siguiente)
      .then((data) => {
        setNoticias((prev) => [...(prev ?? []), ...data.noticias]);
        setHayMas(hayMasPaginas(siguiente, data));
        setPagina(siguiente);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error desconocido")
      )
      .finally(() => setCargando(false));
  }, [pagina]);

  return (
    <section className="noticias-section">
      <div className="wrap">
        {error ? (
          <p className="courses-empty">
            No se pudieron cargar las noticias. Intentá de nuevo en unos
            minutos.
          </p>
        ) : noticias === null ? (
          <>
            <div className="noticias-list" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton skeleton-noticia" />
              ))}
            </div>
            <p className="sr-only" role="status">
              Cargando noticias…
            </p>
          </>
        ) : noticias.length === 0 ? (
          <p className="courses-empty">
            Todavía no hay noticias publicadas. Volvé a visitarnos pronto.
          </p>
        ) : (
          <>
            <div className="noticias-list">
              {noticias.map((noticia) => (
                <NoticiaCard key={noticia.id} noticia={noticia} />
              ))}
            </div>
            {hayMas && (
              <div className="noticias-mas">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={cargando}
                  onClick={verMas}
                >
                  {cargando ? "Cargando…" : "Ver más publicaciones"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}