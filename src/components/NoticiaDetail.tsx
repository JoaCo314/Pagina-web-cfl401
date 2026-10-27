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
  const [copiado, setCopiado] = useState(false);

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

  function copiarEnlace() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  if (estado.estado === "cargando") {
    return (
      <section className="wrap detail-body" id="contenido" tabIndex={-1}>
        {volverAtras}
        <div className="skeleton-detalle" aria-hidden="true">
          <div className="skeleton skeleton-linea corta" />
          <div className="skeleton skeleton-titulo" />
          <div className="skeleton skeleton-img" />
          <div className="skeleton skeleton-linea" />
          <div className="skeleton skeleton-linea media" />
          <div className="skeleton skeleton-linea" />
        </div>
        <p className="sr-only" role="status">
          Cargando noticia…
        </p>
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
      <nav className="noticia-breadcrumb" aria-label="Ruta de navegación">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link href="/noticias">Noticias</Link>
        <span aria-hidden="true">/</span>
        <span className="noticia-breadcrumb-current">{noticia.titulo}</span>
      </nav>

      {volverAtras}

      <article className="noticia-articulo">
        <span className="noticia-date">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
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
            dangerouslySetInnerHTML={{ __html: cuerpoHtml }}
          />
        ) : (
          <div className="noticia-cuerpo">
            {parrafos.map((parrafo, indice) => (
              <p key={indice}>{parrafo}</p>
            ))}
          </div>
        )}

        <div className="noticia-footer-share">
          <span className="noticia-share-title">Compartir esta noticia:</span>
          <div className="noticia-share-buttons">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(noticia.titulo)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn share-whatsapp"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Compartir en WhatsApp
            </a>
            <button
              type="button"
              className="share-btn share-copy"
              onClick={copiarEnlace}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copiado ? "¡Enlace copiado!" : "Copiar enlace"}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
