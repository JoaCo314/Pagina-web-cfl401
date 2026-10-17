// Creado por Joaquin Pernica para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatearFecha,
  iconoCurso,
  nombresDocentes,
} from "@/lib/cursoUtils";

/// Cantidad de cursos por página en el catálogo público. El listado se filtra
/// del lado del cliente (ya se descargan todos los cursos para armar el filtro
/// por rubro), así que la paginación también es local.
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
    <div className="course-card">
      {curso.imagenUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="course-img" src={curso.imagenUrl} alt={curso.nombre} />
      )}
      <div className="course-top">
        <div className="course-icon">
          {iconoCurso(curso.emoji, curso.categoria?.nombre)}
        </div>
        {curso.cupos !== null && (
          <span className={`cupos${cuposBajos ? " pocos" : ""}`}>
            {curso.cupos} cupos
          </span>
        )}
      </div>
      <h3>{curso.nombre}</h3>
      <p>{curso.descripcion ?? "Información disponible próximamente."}</p>
      <p className="course-docente">
        Docente: {nombresDocentes(curso.docentes)}
        {" · "}Inicia {formatearFecha(curso.fechaInicio)}
        {curso.sede ? ` · Sede: ${curso.sede}` : ""}
      </p>
      <div className="course-tags">
        {curso.horarios && <span className="tag">{curso.horarios}</span>}
        {curso.mesesCursada && (
          <span className="tag">Duración: {curso.mesesCursada}</span>
        )}
      </div>
      <div className="course-meta">
        <span className="course-gratis">Gratuito</span>
        <Link href={`/cursos/${curso.id}`} className="course-link">
          Ver detalle →
        </Link>
      </div>
    </div>
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

  // Cualquier cambio de filtro vuelve a la primera página para no quedar en una
  // página que ya no tiene resultados.
  useEffect(() => {
    setPagina(1);
  }, [busqueda, rubro]);

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
            <input
              type="text"
              className="filter-input"
              placeholder="Buscar por nombre de curso o palabra clave..."
              aria-label="Buscar cursos por nombre o palabra clave"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
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
                términos.
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
                <nav className="paginacion" aria-label="Paginación del catálogo de cursos">
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