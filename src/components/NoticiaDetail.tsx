"use client";

import Link from "next/link";
import DOMPurify from "dompurify";
import { useEffect, useState } from "react";
import {
  dividirParrafos,
  formatearFechaLarga,
  type Noticia,
} from "@/lib/noticiaUtils";

type Estado =
  | { estado: "cargando" }
  | { estado: "no-encontrado" }
  | { estado: "error" }
  | { estado: "ok"; noticia: Noticia };

const volverAtras = (
  <Link href="/noticias" className="detail-back">
    ← Volver a las noticias
  </Link>
);

function MensajeSinNoticia({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="wrap detail-body" id="contenido" tabIndex={-1}>
      <div className="detail-notfound">
        <span className="detail-nf-code">404</span>
        <h1>{titulo}</h1>
        <p>{texto}</p>
        <Link href="/noticias" className="nav-cta">
          Ver todas las noticias
        </Link>
      </div>
    </section>
  );
}

export default function NoticiaDetail({ id }: { id: number }) {
  const [estado, setEstado] = useState<Estado>({ estado: "cargando" });

  useEffect(() => {
    let activo = true;

    fetch(`/api/noticias/${id}`)
      .then(async (res) => {
        if (res.status === 404 || res.status === 400) {
          throw new Error("no-encontrado");
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as { noticia: Noticia };
        return data.noticia;
      })
      .then((noticia) => {
        if (activo) setEstado({ estado: "ok", noticia });
      })
      .catch((err: Error) => {
        if (!activo) return;
        setEstado({
          estado: err.message === "no-encontrado" ? "no-encontrado" : "error",
        });
      });

    return () => {
      activo = false;
    };
  }, [id]);

  if (estado.estado === "cargando") {
    return (
      <section className="wrap detail-body" id="contenido" tabIndex={-1}>
        {volverAtras}
        <p className="courses-empty">Cargando noticia…</p>
      </section>
    );
  }

  if (estado.estado === "no-encontrado") {
    return (
      <MensajeSinNoticia
        titulo="No encontramos esta noticia"
        texto="Puede que haya sido dada de baja o que el enlace no sea correcto."
      />
    );
  }

  if (estado.estado === "error") {
    return (
      <MensajeSinNoticia
        titulo="No se pudo cargar la noticia"
        texto="Estamos teniendo un problema temporal. Intentá de nuevo en unos minutos."
      />
    );
  }

  const { noticia } = estado;
  const parrafos = dividirParrafos(noticia.contenido);
  const cuerpoHtml = noticia.contenidoHtml
    ? DOMPurify.sanitize(noticia.contenidoHtml)
    : null;

  return (
    <section className="wrap detail-body" id="contenido" tabIndex={-1}>
      {volverAtras}

      <article className="noticia-articulo">
        <span className="noticia-date">
          {formatearFechaLarga(noticia.fecha)}
        </span>
        <h1>{noticia.titulo}</h1>
        {noticia.resumen && <p className="noticia-bajada">{noticia.resumen}</p>}
        {noticia.imagenUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="noticia-hero"
            src={noticia.imagenUrl}
            alt={noticia.titulo}
          />
        )}
        {cuerpoHtml ? (
          <div
            className="noticia-cuerpo"
            // El HTML ya se sanéa en el servidor (sanitize-html) al guardar y
            // se vuelve a sanear acá con DOMPurify antes de renderizarse.
            dangerouslySetInnerHTML={{ __html: cuerpoHtml }}
          />
        ) : (
          <div className="noticia-cuerpo">
            {parrafos.map((parrafo, indice) => (
              <p key={indice}>{parrafo}</p>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
