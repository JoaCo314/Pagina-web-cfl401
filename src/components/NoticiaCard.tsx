import Link from "next/link";
import { formatearFechaLarga, type Noticia } from "@/lib/noticiaUtils";

export default function NoticiaCard({ noticia }: { noticia: Noticia }) {
  return (
    <article
      className={`noticia-card${noticia.imagenUrl ? " con-imagen" : ""}`}
    >
      {noticia.imagenUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="noticia-img" src={noticia.imagenUrl} alt={noticia.titulo} />
      )}
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
