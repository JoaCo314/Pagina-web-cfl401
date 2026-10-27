"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HtmlEnriquecido from "@/components/HtmlEnriquecido";
import {
  formatearFecha,
  iconoCurso,
  nombresDocentes,
} from "@/lib/cursoUtils";

type CursoDetail = {
  id: number;
  nombre: string;
  descripcion: string | null;
  modalidad: string | null;
  horarios: string | null;
  mesesCursada: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  sede: string | null;
  enlaceInscripcion: string | null;
  programaContenidos: string | null;
  programaContenidosHtml: string | null;
  categoria: { id: number; nombre: string } | null;
  emoji: string | null;
  cupos: number | null;
  imagenUrl: string | null;
  informacionAdicional: string | null;
  docentes: { docente: { id: number; nombre: string; apellido: string } }[];
};

type Estado =
  | { estado: "cargando" }
  | { estado: "no-encontrado" }
  | { estado: "error" }
  | { estado: "ok"; curso: CursoDetail };

const volverAlCatalogo = (
  <Link href="/cursos" className="detail-back">
    ← Volver a la oferta educativa
  </Link>
);

function MensajeSinCurso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="wrap detail-body" id="contenido" tabIndex={-1}>
      {volverAlCatalogo}
      <div className="detail-notfound">
        <span className="detail-nf-code">404</span>
        <h1>{titulo}</h1>
        <p>{texto}</p>
        <Link href="/cursos" className="nav-cta">
          Mirar la oferta educativa
        </Link>
      </div>
    </section>
  );
}

export default function CourseDetail({ id }: { id: number }) {
  const [estado, setEstado] = useState<Estado>({ estado: "cargando" });
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let activo = true;

    fetch(`/api/cursos/${id}`)
      .then(async (res) => {
        if (res.status === 404 || res.status === 400) {
          throw new Error("no-encontrado");
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as { curso: CursoDetail };
        return data.curso;
      })
      .then((curso) => {
        if (activo) setEstado({ estado: "ok", curso });
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
        {volverAlCatalogo}
        <div className="skeleton-detalle" aria-hidden="true">
          <div className="skeleton skeleton-img" />
          <div className="skeleton skeleton-titulo" />
          <div className="skeleton skeleton-linea" />
          <div className="skeleton skeleton-linea media" />
          <div className="skeleton skeleton-linea" />
          <div className="skeleton skeleton-linea corta" />
        </div>
        <p className="sr-only" role="status">
          Cargando curso…
        </p>
      </section>
    );
  }

  if (estado.estado === "no-encontrado") {
    return (
      <MensajeSinCurso
        titulo="No encontramos este curso"
        texto="Puede que haya sido dado de baja o que el enlace no sea correcto."
      />
    );
  }

  if (estado.estado === "error") {
    return (
      <MensajeSinCurso
        titulo="No se pudo cargar el curso"
        texto="Estamos teniendo un problema temporal. Intentá de nuevo en unos minutos."
      />
    );
  }

  const { curso } = estado;
  const cuposText = curso.cupos === null ? "A consultar" : `${curso.cupos} cupos`;

  return (
    <section className="wrap detail-body" id="contenido" tabIndex={-1}>
      {volverAlCatalogo}

      <div className="detail-layout">
        <div className="detail-main">
          {curso.imagenUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="detail-img"
              src={curso.imagenUrl}
              alt={curso.nombre}
            />
          )}
          <div className="detail-head">
            <div className="course-icon">
              {iconoCurso(curso.emoji, curso.categoria?.nombre)}
            </div>
            <div>
              <div className="detail-tags">
                {curso.categoria && (
                  <span className="tag">{curso.categoria.nombre}</span>
                )}
                {curso.cupos !== null && (
                  <span className={`cupos${curso.cupos <= 5 ? " pocos" : ""}`}>
                    {curso.cupos <= 5 ? `¡Últimos ${curso.cupos} cupos!` : cuposText}
                  </span>
                )}
                <span className="tag tag-gratis">100% Gratuito</span>
              </div>
              <h1>{curso.nombre}</h1>
              <p className="desc">
                {curso.descripcion ?? "Información disponible próximamente."}
              </p>
            </div>
          </div>

          <section className="detail-section">
            <h2>Programa y contenidos</h2>
            {curso.programaContenidos ? (
              <HtmlEnriquecido
                html={curso.programaContenidosHtml}
                textoPlano={curso.programaContenidos}
              />
            ) : (
              <p>El programa detallado estará disponible próximamente.</p>
            )}
          </section>

          {curso.informacionAdicional && (
            <section className="detail-section">
              <h2>Información adicional</h2>
              <p>{curso.informacionAdicional}</p>
            </section>
          )}
        </div>

        <aside className="detail-aside">
          <div className="detail-card">
            <h2>Datos del curso</h2>
            <dl className="detail-list">
              <div className="detail-item">
                <dt>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  Modalidad
                </dt>
                <dd>{curso.modalidad ?? "Presencial"}</dd>
              </div>

              <div className="detail-item">
                <dt>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Sede
                </dt>
                <dd>{curso.sede ?? "Sede Central CFL 401"}</dd>
              </div>

              <div className="detail-item">
                <dt>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Horarios
                </dt>
                <dd>{curso.horarios ?? "A confirmar"}</dd>
              </div>

              <div className="detail-item">
                <dt>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Duración
                </dt>
                <dd>{curso.mesesCursada ?? "A confirmar"}</dd>
              </div>

              <div className="detail-item">
                <dt>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Inicio
                </dt>
                <dd>{formatearFecha(curso.fechaInicio)}</dd>
              </div>

              <div className="detail-item">
                <dt>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <line x1="4" y1="22" x2="4" y2="2" />
                    <polygon points="4 2 20 7 4 12" />
                  </svg>
                  Fin de cursada
                </dt>
                <dd>{formatearFecha(curso.fechaFin)}</dd>
              </div>

              <div className="detail-item">
                <dt>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Docente
                </dt>
                <dd>{nombresDocentes(curso.docentes)}</dd>
              </div>

              <div className="detail-item">
                <dt>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Cupos
                </dt>
                <dd>{cuposText}</dd>
              </div>
            </dl>

            {curso.enlaceInscripcion ? (
              <a
                href={curso.enlaceInscripcion}
                className="detail-cta"
                target="_blank"
                rel="noopener noreferrer"
              >
                Inscribirme online ↗
              </a>
            ) : (
              <Link href="/#guia" className="detail-cta">
                Ver pasos de inscripción presencial
              </Link>
            )}

            <div className="detail-share-box">
              <span className="detail-share-title">Compartir este curso:</span>
              <div className="detail-share-actions">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Mirá el curso de ${curso.nombre} en el CFL 401 de Azul.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn share-whatsapp"
                  title="Compartir por WhatsApp"
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
                  WhatsApp
                </a>
                <button
                  type="button"
                  className="share-btn share-copy"
                  onClick={copiarEnlace}
                  title="Copiar enlace al portapapeles"
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
                  {copiado ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
