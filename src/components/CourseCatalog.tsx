"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatearFecha,
  iconoCategoria,
  nombresDocentes,
} from "@/lib/cursoUtils";

type Docente = { id: number; nombre: string; apellido: string };

type Curso = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  cupos: number | null;
  modalidad: string | null;
  horarios: string | null;
  mesesCursada: string | null;
  fechaInicio: string | null;
  docentes: { docente: Docente }[];
};

type Categoria = { categoria: string; cursos: Curso[] };

function CourseCard({ curso }: { curso: Curso }) {
  const cuposBajos = curso.cupos !== null && curso.cupos <= 5;

  return (
    <div className="course-card">
      <div className="course-top">
        <div className="course-icon">{iconoCategoria(curso.categoria)}</div>
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

  const hayFiltros = busqueda.trim() !== "" || rubro !== "";

  const cursosFiltrados = useMemo(() => {
    if (!categorias) return [];
    const termino = busqueda.trim().toLowerCase();
    return categorias.flatMap((c) =>
      c.cursos.filter((curso) => {
        const cumpleRubro = rubro === "" || curso.categoria === rubro;
        const cumpleBusqueda =
          termino === "" ||
          curso.nombre.toLowerCase().includes(termino) ||
          (curso.descripcion ?? "").toLowerCase().includes(termino);
        return cumpleRubro && cumpleBusqueda;
      })
    );
  }, [categorias, busqueda, rubro]);

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
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <select
              className="filter-select"
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
            <p className="courses-empty">Cargando cursos…</p>
          ) : cursosFiltrados.length === 0 ? (
            <p className="courses-empty">
              No encontramos cursos con esos filtros. Probá con otros términos.
            </p>
          ) : hayFiltros ? (
            <div className="course-grid">
              {cursosFiltrados.map((curso) => (
                <CourseCard key={curso.id} curso={curso} />
              ))}
            </div>
          ) : (
            categorias.map((categoria) => (
              <div key={categoria.categoria} className="category-group">
                <h2 className="category-label">{categoria.categoria}</h2>
                <div className="course-grid">
                  {categoria.cursos.map((curso) => (
                    <CourseCard key={curso.id} curso={curso} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}