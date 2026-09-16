"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DocenteActivo } from "@/lib/cursoAdmin";

export type CursoFormInicial = {
  id: number;
  nombre: string;
  descripcion: string | null;
  modalidad: string | null;
  horarios: string | null;
  mesesCursada: string | null;
  fechaInicio: string | null;
  programaContenidos: string | null;
  categoria: string | null;
  cupos: number | null;
  imagenUrl: string | null;
  informacionAdicional: string | null;
  activo: boolean;
  docentes: { docenteId: number }[];
};

export default function CursoForm({
  docentes,
  inicial,
}: {
  docentes: DocenteActivo[];
  inicial?: CursoFormInicial;
}) {
  const esEdicion = Boolean(inicial);
  const router = useRouter();

  const [datos, setDatos] = useState({
    nombre: inicial?.nombre ?? "",
    descripcion: inicial?.descripcion ?? "",
    modalidad: inicial?.modalidad ?? "",
    horarios: inicial?.horarios ?? "",
    mesesCursada: inicial?.mesesCursada ?? "",
    fechaInicio: inicial?.fechaInicio ?? "",
    programaContenidos: inicial?.programaContenidos ?? "",
    categoria: inicial?.categoria ?? "",
    cupos: inicial?.cupos != null ? String(inicial.cupos) : "",
    imagenUrl: inicial?.imagenUrl ?? "",
    informacionAdicional: inicial?.informacionAdicional ?? "",
  });
  const [activo, setActivo] = useState(inicial?.activo ?? true);
  const [docenteIds, setDocenteIds] = useState<number[]>(
    inicial?.docentes.map((d) => d.docenteId) ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function setCampo(campo: string, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  function alternarDocente(id: number) {
    setDocenteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function validarFront(): string | null {
    if (!datos.nombre.trim()) {
      return "El nombre del curso es obligatorio.";
    }
    if (datos.cupos.trim() !== "") {
      const cupos = Number(datos.cupos);
      if (!Number.isInteger(cupos) || cupos < 0) {
        return "Los cupos deben ser un número entero mayor o igual a 0.";
      }
    }
    if (datos.fechaInicio.trim() !== "") {
      const fecha = new Date(datos.fechaInicio);
      if (Number.isNaN(fecha.getTime())) {
        return "La fecha de inicio no es válida.";
      }
      if (!datos.fechaInicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return "La fecha de inicio debe tener el formato AAAA-MM-DD.";
      }
    }
    return null;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const errorForm = validarFront();
    if (errorForm) {
      setError(errorForm);
      return;
    }

    setEnviando(true);
    try {
      const body = {
        ...datos,
        activo,
        docenteIds,
      };

      const res = await fetch(
        esEdicion ? `/api/cursos/${inicial!.id}` : "/api/cursos",
        {
          method: esEdicion ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        router.push("/panel/cursos");
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo guardar el curso.");
    } catch {
      setError("No se pudo guardar el curso. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="curso-form" onSubmit={onSubmit} noValidate>
      <label className="form-field">
        <span>
          Nombre del curso <strong>*</strong>
        </span>
        <input
          type="text"
          value={datos.nombre}
          onChange={(e) => setCampo("nombre", e.target.value)}
          placeholder="Ej: Reparación y Mantenimiento de PC"
        />
      </label>

      <label className="form-field">
        <span>Categoría / rubro</span>
        <input
          type="text"
          value={datos.categoria}
          onChange={(e) => setCampo("categoria", e.target.value)}
          placeholder="Ej: Informática"
        />
      </label>

      <label className="form-field">
        <span>Modalidad</span>
        <input
          type="text"
          value={datos.modalidad}
          onChange={(e) => setCampo("modalidad", e.target.value)}
          placeholder="Ej: Presencial"
        />
      </label>

      <label className="form-field">
        <span>Horarios</span>
        <input
          type="text"
          value={datos.horarios}
          onChange={(e) => setCampo("horarios", e.target.value)}
          placeholder="Ej: Lunes y miércoles de 18 a 21 hs. (C2)"
        />
      </label>

      <label className="form-field">
        <span>Meses de cursada</span>
        <input
          type="text"
          value={datos.mesesCursada}
          onChange={(e) => setCampo("mesesCursada", e.target.value)}
          placeholder="Ej: 4 meses"
        />
      </label>

      <label className="form-field">
        <span>Fecha de inicio</span>
        <input
          type="date"
          value={datos.fechaInicio}
          onChange={(e) => setCampo("fechaInicio", e.target.value)}
        />
      </label>

      <label className="form-field">
        <span>Cupos</span>
        <input
          type="number"
          min={0}
          value={datos.cupos}
          onChange={(e) => setCampo("cupos", e.target.value)}
          placeholder="Ej: 15"
        />
      </label>

      <label className="form-field">
        <span>URL de imagen (opcional)</span>
        <input
          type="url"
          value={datos.imagenUrl}
          onChange={(e) => setCampo("imagenUrl", e.target.value)}
          placeholder="https://"
        />
      </label>

      <div className="form-field form-field-full">
        <span>Descripción</span>
        <textarea
          rows={3}
          value={datos.descripcion}
          onChange={(e) => setCampo("descripcion", e.target.value)}
          placeholder="Descripción breve del curso"
        />
      </div>

      <div className="form-field form-field-full">
        <span>Programa / contenidos</span>
        <textarea
          rows={4}
          value={datos.programaContenidos}
          onChange={(e) => setCampo("programaContenidos", e.target.value)}
          placeholder="Contenidos, habilidades y temas del curso"
        />
      </div>

      <div className="form-field form-field-full">
        <span>Información adicional</span>
        <textarea
          rows={2}
          value={datos.informacionAdicional}
          onChange={(e) => setCampo("informacionAdicional", e.target.value)}
          placeholder="Ej: cupos limitados, requisitos extra, materiales"
        />
      </div>

      <div className="form-field form-field-full">
        <span>Docentes asignados</span>
        {docentes.length === 0 ? (
          <p className="form-aviso">
            Todavía no hay docentes activos. Creá usuarios con rol Docente para
            poder asignarlos.
          </p>
        ) : (
          <div className="docentes-box">
            {docentes.map((docente) => {
              const activoDocente = docenteIds.includes(docente.id);
              return (
                <label
                  key={docente.id}
                  className={`docente-opt${activoDocente ? " activo" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={activoDocente}
                    onChange={() => alternarDocente(docente.id)}
                  />
                  <span>
                    <strong>
                      {docente.nombre} {docente.apellido}
                    </strong>
                    <small>{docente.email}</small>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {esEdicion && (
        <label className="form-field form-field-full form-toggle">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          <span>Curso activo (visible en el catálogo público)</span>
        </label>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary btn-sm" disabled={enviando}>
          {enviando
            ? "Guardando…"
            : esEdicion
              ? "Guardar cambios"
              : "Crear curso"}
        </button>
        <a
          href="/panel/cursos"
          className="btn-ghost-dark"
          onClick={(e) => {
            e.preventDefault();
            router.push("/panel/cursos");
          }}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}