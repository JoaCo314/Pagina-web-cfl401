"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import HtmlEnriquecido from "@/components/HtmlEnriquecido";

export type FaqCategoria = {
  id: number;
  nombre: string;
  preguntas: {
    id: number;
    pregunta: string;
    respuesta: string;
    respuestaHtml: string | null;
  }[];
};

export default function FaqList({ categorias }: { categorias: FaqCategoria[] }) {
  const [abiertas, setAbiertas] = useState<number[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const todasLasPreguntasIds = useMemo(
    () => categorias.flatMap((c) => c.preguntas.map((p) => p.id)),
    [categorias]
  );

  const termino = busqueda.trim().toLowerCase();

  const categoriasFiltradas = useMemo(() => {
    if (!termino) return categorias;
    return categorias
      .map((cat) => ({
        ...cat,
        preguntas: cat.preguntas.filter(
          (p) =>
            p.pregunta.toLowerCase().includes(termino) ||
            p.respuesta.toLowerCase().includes(termino)
        ),
      }))
      .filter((cat) => cat.preguntas.length > 0);
  }, [categorias, termino]);

  function toggle(id: number) {
    setAbiertas((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function expandirTodas() {
    setAbiertas(todasLasPreguntasIds);
  }

  function contraerTodas() {
    setAbiertas([]);
  }

  return (
    <div className="faq-wrap">
      <div className="faq-toolbar">
        <div className="faq-search-box">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="faq-search-icon"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="faq-search-input"
            placeholder="Buscar pregunta o palabra clave (ej. requisitos, horarios, certificados)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar en preguntas frecuentes"
          />
          {busqueda && (
            <button
              type="button"
              className="faq-clear-btn"
              onClick={() => setBusqueda("")}
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <div className="faq-toggle-actions">
          <button
            type="button"
            className="faq-action-link"
            onClick={expandirTodas}
          >
            Abrir todas
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            className="faq-action-link"
            onClick={contraerTodas}
          >
            Cerrar todas
          </button>
        </div>
      </div>

      {termino && (
        categoriasFiltradas.length === 0 ? (
          <div className="faq-sin-resultados" role="status">
            <div className="faq-sin-resultados-icono" aria-hidden="true">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3>¿No encontraste lo que buscabas?</h3>
            <p>
              No encontramos preguntas para &ldquo;{busqueda}&rdquo;. Probá con
              otros términos, restablecé la búsqueda o consultanos directamente.
            </p>
            <div className="faq-sin-resultados-acciones">
              <button
                type="button"
                className="btn-ghost-dark"
                onClick={() => setBusqueda("")}
              >
                Ver todas las preguntas
              </button>
              <Link href="/contacto" className="btn-primary">
                Hacer una consulta
              </Link>
            </div>
          </div>
        ) : (
          <p className="faq-search-status" role="status">
            Resultados para &ldquo;{busqueda}&rdquo;:
          </p>
        )
      )}

      {categoriasFiltradas.map((categoria) => (
        <section key={categoria.id} className="faq-categoria">
          <h2>{categoria.nombre}</h2>
          <div className="faq-lista">
            {categoria.preguntas.map((pregunta) => {
              // Si hay término de búsqueda activo, mostramos abiertas automáticamente
              const abierta =
                termino.length > 0 || abiertas.includes(pregunta.id);
              return (
                <div key={pregunta.id} className="faq-item">
                  <button
                    type="button"
                    className="faq-pregunta"
                    aria-expanded={abierta}
                    aria-controls={`faq-respuesta-${pregunta.id}`}
                    onClick={() => toggle(pregunta.id)}
                  >
                    <span>{pregunta.pregunta}</span>
                    <span className="faq-icon" aria-hidden="true" />
                  </button>
                  <div
                    id={`faq-respuesta-${pregunta.id}`}
                    className={`faq-respuesta${abierta ? " abierta" : ""}`}
                  >
                    <HtmlEnriquecido
                      html={pregunta.respuestaHtml}
                      textoPlano={pregunta.respuesta}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
