// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatearFecha,
  iconoCurso,
  nombresDocentes,
} from "@/lib/cursoUtils";

/// Cantidad de cursos por página en el catálogo público.
const CURSOS_POR_PAGINA = 6;

type Docente = { id: number; nombre: string; apellido: string };

type Curso = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: { id: number; nombre: string } | null;
  emoji: string | null;
  cupos: number | null;
  modalidad: string | null;
  horarios: string | null;
  mesesCursada: string | null;
  fechaInicio: string | null;
  sede: string | null;
  imagenUrl: string | null;
  docentes: { docente: Docente }[];
};

type Categoria = { categoria: string; cursos: Curso[] };

function CourseCard({ curso }: { curso: Curso }) {
  const cuposBajos = curso.cupos !== null && curso.cupos <= 5;

  return (
    <article className="course-card">
      {curso.imagenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="course-img" src={curso.imagenUrl} alt={curso.nombre} />
      ) : (
        <div className="course-img-placeholder" aria-hidden="true">
          <span className="course-placeholder-icon">
            {iconoCurso(curso.emoji, curso.categoria?.nombre)}
          </span>
          <span className="course-placeholder-tag">
            {curso.categoria?.nombre ?? "Capacitación laboral"}
          </span>
        </div>
      )}

      <div className="course-top">
        <div className="course-icon">
          {iconoCurso(curso.emoji, curso.categoria?.nombre)}
        </div>
        {curso.cupos !== null && (
          <span className={`cupos${cuposBajos ? " pocos" : ""}`}>
            {cuposBajos ? `¡Últimos ${curso.cupos} cupos!` : `${curso.cupos} cupos`}
          </span>
        )}
      </div>

      <h3>
        <Link href={`/cursos/${curso.id}`} className="course-title-link">
          {curso.nombre}
        </Link>
      </h3>

      <p>{curso.descripcion ?? "Información disponible próximamente."}</p>

      <p className="course-docente">
        <strong>Docente:</strong> {nombresDocentes(curso.docentes)}
        {" · "}Inicia {formatearFecha(curso.fechaInicio)}
      </p>

      <div className="course-tags">
        {curso.horarios && (
          <span className="tag">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {curso.horarios}
          </span>
        )}
        {curso.mesesCursada && (
          <span className="tag">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Duración: {curso.mesesCursada}
          </span>
        )}
        {curso.sede && (
          <span className="tag">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {curso.sede}
          </span>
        )}
      </div>

      <div className="course-meta">
        <span className="course-gratis">100% Gratuito</span>
        <Link href={`/cursos/${curso.id}`} className="course-link">
          Ver detalle →
        </Link>
      </div>
    </article>
  );
}

export default function CourseCatalog() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [rubro, setRubro] = useState("");
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    fetch("/api/cursos?groupBy=categoria")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))
      )
      .then((data) => setCategorias(data.categorias as Categoria[]))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error desconocido")
      );
  }, []);

  const rubros = useMemo(
    () => (categorias ?? []).map((c) => c.categoria),
    [categorias]
  );

  const cursosFiltrados = useMemo(() => {
    if (!categorias) return [];
    const termino = busqueda.trim().toLowerCase();
    return categorias.flatMap((c) =>
      c.cursos.filter((curso) => {
        const cumpleRubro = rubro === "" || curso.categoria?.nombre === rubro;
        const cumpleBusqueda =
          termino === "" ||
          curso.nombre.toLowerCase().includes(termino) ||
          (curso.descripcion ?? "").toLowerCase().includes(termino);
        return cumpleRubro && cumpleBusqueda;
      })
    );
  }, [categorias, busqueda, rubro]);

  const hayFiltros = busqueda.trim() !== "" || rubro !== "";

  // Cualquier cambio de filtro vuelve a la primera página sin causar renders en cascada
  const [prevFiltros, setPrevFiltros] = useState({ busqueda, rubro });
  if (prevFiltros.busqueda !== busqueda || prevFiltros.rubro !== rubro) {
    setPrevFiltros({ busqueda, rubro });
    setPagina(1);
  }

  const totalPaginas = Math.max(
    1,
    Math.ceil(cursosFiltrados.length / CURSOS_POR_PAGINA)
  );
  const paginaSegura = Math.min(pagina, totalPaginas);
  const cursosPagina = cursosFiltrados.slice(
    (paginaSegura - 1) * CURSOS_POR_PAGINA,
    paginaSegura * CURSOS_POR_PAGINA
  );

  function irAPagina(nueva: number) {
    setPagina(nueva);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limpiarFiltros() {
    setBusqueda("");
    setRubro("");
  }

  if (error) {
    return (
      <p className="courses-empty">
        No se pudieron cargar los cursos. Intentá de nuevo en unos minutos.
      </p>
    );
  }

  return (
    <>
      <section className="filters-sec">
        <div className="wrap">
          <div className="filters-grid">
            <div className="filter-search-wrap">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                className="search-icon"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="filter-input filter-input-with-icon"
                placeholder="Buscar por nombre de curso o palabra clave..."
                aria-label="Buscar cursos por nombre o palabra clave"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button
                  type="button"
                  className="search-clear-btn"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setBusqueda("")}
                >
                  ✕
                </button>
              )}
            </div>

            <select
              className="filter-select"
              aria-label="Filtrar cursos por rubro"
              value={rubro}
              onChange={(e) => setRubro(e.target.value)}
            >
              <option value="">Todos los rubros</option>
              {rubros.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {rubros.length > 0 && (
            <div className="filter-chips">
              <button
                type="button"
                className={`filter-chip${rubro === "" ? " active" : ""}`}
                onClick={() => setRubro("")}
              >
                Todos
              </button>
              {rubros.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`filter-chip${rubro === r ? " active" : ""}`}
                  onClick={() => setRubro(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {categorias !== null && (
            <div className="courses-results-bar">
              <span className="courses-count">
                {cursosFiltrados.length === 1
                  ? "1 curso disponible"
                  : `${cursosFiltrados.length} cursos disponibles`}
                {rubro ? ` en ${rubro}` : ""}
                {busqueda.trim() ? ` para "${busqueda.trim()}"` : ""}
              </span>
              {hayFiltros && (
                <button
                  type="button"
                  className="link-limpiar-filtros"
                  onClick={limpiarFiltros}
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="courses-section">
        <div className="wrap">
          {categorias === null ? (
            <>
              <div className="course-grid" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="course-card skeleton-tarjeta">
                    <div className="skeleton skeleton-img" />
                    <div className="skeleton skeleton-linea corta" />
                    <div className="skeleton skeleton-linea media" />
                    <div className="skeleton skeleton-linea" />
                    <div className="skeleton skeleton-linea corta" />
                  </div>
                ))}
              </div>
              <p className="sr-only" role="status">
                Cargando cursos…
              </p>
            </>
          ) : cursosFiltrados.length === 0 ? (
            <div className="courses-empty">
              <p>
                No encontramos cursos con esos filtros. Probá con otros
                términos o cambiá el rubro seleccionado.
              </p>
              {hayFiltros && (
                <button
                  type="button"
                  className="btn-ghost-dark"
                  onClick={limpiarFiltros}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="course-grid">
                {cursosPagina.map((curso) => (
                  <CourseCard key={curso.id} curso={curso} />
                ))}
              </div>
              {totalPaginas > 1 && (
                <nav
                  className="paginacion"
                  aria-label="Paginación del catálogo de cursos"
                >
                  <button
                    type="button"
                    className="btn-sm btn-ghost-dark"
                    onClick={() => irAPagina(paginaSegura - 1)}
                    disabled={paginaSegura <= 1}
                    aria-label="Página anterior"
                  >
                    ← Anterior
                  </button>
                  <span className="paginacion-info" aria-current="page">
                    Página {paginaSegura} de {totalPaginas}
                  </span>
                  <button
                    type="button"
                    className="btn-sm btn-ghost-dark"
                    onClick={() => irAPagina(paginaSegura + 1)}
                    disabled={paginaSegura >= totalPaginas}
                    aria-label="Página siguiente"
                  >
                    Siguiente →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
