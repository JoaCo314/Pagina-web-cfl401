"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatearFecha,
  iconoCategoria,
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
  categoria: string | null;
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

  if (estado.estado === "cargando") {
    return (
      <section className="wrap detail-body" id="contenido" tabIndex={-1}>
        {volverAlCatalogo}
        <p className="courses-empty">Cargando curso…</p>
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
  const cuposText = curso.cupos === null ? "—" : `${curso.cupos} cupos`;

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
            <div className="course-icon">{iconoCategoria(curso.categoria)}</div>
            <div>
              <div className="detail-tags">
                {curso.categoria && (
                  <span className="tag">{curso.categoria}</span>
                )}
                {curso.cupos !== null && (
                  <span className={`cupos${curso.cupos <= 5 ? " pocos" : ""}`}>
                    {cuposText}
                  </span>
                )}
              </div>
              <h1>{curso.nombre}</h1>
              <p className="desc">
                {curso.descripcion ?? "Información disponible próximamente."}
              </p>
            </div>
          </div>

          <section className="detail-section">
            <h2>Programa y contenidos</h2>
            <p>
              {curso.programaContenidos ??
                "El programa detallado estará disponible próximamente."}
            </p>
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
            <dl>
              <div className="detail-item">
                <dt>Modalidad</dt>
                <dd>{curso.modalidad ?? "A confirmar"}</dd>
              </div>
              <div className="detail-item">
                <dt>Sede</dt>
                <dd>{curso.sede ?? "A confirmar"}</dd>
              </div>
              <div className="detail-item">
                <dt>Horarios</dt>
                <dd>{curso.horarios ?? "A confirmar"}</dd>
              </div>
              <div className="detail-item">
                <dt>Duración</dt>
                <dd>{curso.mesesCursada ?? "A confirmar"}</dd>
              </div>
              <div className="detail-item">
                <dt>Inicio</dt>
                <dd>{formatearFecha(curso.fechaInicio)}</dd>
              </div>
              <div className="detail-item">
                <dt>Fin de cursada</dt>
                <dd>{formatearFecha(curso.fechaFin)}</dd>
              </div>
              <div className="detail-item">
                <dt>Docente</dt>
                <dd>{nombresDocentes(curso.docentes)}</dd>
              </div>
              <div className="detail-item">
                <dt>Cupos</dt>
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
                Inscribirme
              </a>
            ) : (
              <Link href="/#guia" className="detail-cta">
                Inscribirme
              </Link>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}