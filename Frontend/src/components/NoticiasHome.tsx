"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NoticiaCard from "@/components/NoticiaCard";
import type { Noticia } from "@/lib/noticiaUtils";

/// Bloque de la home con las últimas 3 noticias publicadas. Si no hay
/// noticias (o falla la carga) no se muestra nada, para no dejar un bloque
/// vacío en la página de inicio.
export default function NoticiasHome() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    fetch("/api/noticias?limit=3")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setNoticias((data.noticias as Noticia[]) ?? []))
      .catch(() => setNoticias([]));
  }, []);

  if (noticias.length === 0) return null;

  return (
    <section className="noticias-section">
      <div className="wrap">
        <div className="section-head">
          <h2>Últimas noticias</h2>
          <p>
            Convocatorias, aperturas de inscripción y novedades institucionales
            del CFL 401.
          </p>
        </div>
        <div className="noticias-home">
          {noticias.map((noticia) => (
            <NoticiaCard key={noticia.id} noticia={noticia} />
          ))}
        </div>
        <div className="noticias-home-cta">
          <Link href="/noticias" className="btn-primary btn-sm">
            Ver todas las noticias
          </Link>
        </div>
      </div>
    </section>
  );
}
