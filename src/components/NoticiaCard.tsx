"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatearFechaLarga, type Noticia } from "@/lib/noticiaUtils";

export default function NoticiaCard({ noticia }: { noticia: Noticia }) {
  const [prevUrl, setPrevUrl] = useState(noticia.imagenUrl);
  const [imgError, setImgError] = useState(false);

  if (prevUrl !== noticia.imagenUrl) {
    setPrevUrl(noticia.imagenUrl);
    setImgError(false);
  }

  const tieneImagen = Boolean(noticia.imagenUrl) && !imgError;

  return (
    <article className="noticia-card con-imagen">
      <div className="noticia-img aspect-video relative overflow-hidden shrink-0">
        {tieneImagen ? (
          <Image
            className="object-cover"
            src={noticia.imagenUrl!}
            alt={`Imagen representativa: ${noticia.titulo}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImgError(true)}
            unoptimized={
              noticia.imagenUrl!.startsWith("http:") ||
              noticia.imagenUrl!.endsWith(".svg")
            }
          />
        ) : (
          <div
            className="w-full h-full min-h-[160px] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#122a45] via-[#1b3a5c] to-[#2a6ea3] text-white p-4 text-center select-none"
            aria-label={`Noticia: ${noticia.titulo}`}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="opacity-80"
            >
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              <path d="M18 14h-8" />
              <path d="M15 18h-5" />
              <path d="M10 6h8v4h-8V6Z" />
            </svg>
            <span className="text-[11.5px] font-semibold uppercase tracking-wider opacity-85">
              Noticia CFL 401
            </span>
          </div>
        )}
      </div>
      <div className="noticia-body">
        <span className="noticia-date">
          <svg
            width="13"
            height="13"
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
        <h3>
          <Link href={`/noticias/${noticia.id}`} className="noticia-title-link">
            {noticia.titulo}
          </Link>
        </h3>
        {noticia.resumen && <p>{noticia.resumen}</p>}
        <Link href={`/noticias/${noticia.id}`} className="read-more">
          Leer nota completa →
        </Link>
      </div>
    </article>
  );
}
