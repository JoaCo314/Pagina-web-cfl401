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
          {formatearFechaLarga(noticia.fecha)}
        </span>
        <h3>{noticia.titulo}</h3>
        {noticia.resumen && <p>{noticia.resumen}</p>}
        <Link href={`/noticias/${noticia.id}`} className="read-more">
          Leer nota completa →
        </Link>
      </div>
    </article>
  );
}
