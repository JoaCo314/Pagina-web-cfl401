"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DocenteAsignable } from "@/lib/cursoAdmin";
import EditorTextoEnriquecido from "@/components/panel/EditorTextoEnriquecido";
import { extraerTextoPlano, valorInicialEditor } from "@/lib/htmlEnriquecidoUtil";
import CampoImagen from "@/components/panel/CampoImagen";
import type { EstadoImagen } from "@/components/panel/CampoImagen";
import {
  subirImagen,
  validarArchivoImagen,
  eliminarImagenHuerfana,
} from "@/lib/imagenesCliente";

export type CursoFormInicial = {
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
  categoria: string | null;
  emoji: string | null;
  cupos: number | null;
  imagenUrl: string | null;
  informacionAdicional: string | null;
  activo: boolean;
  docentes: { docenteId: number }[];
};

export default function CursoForm({
  docentes,
  inicial,
  puedeAsignarDocentes = true,
}: {
  docentes: DocenteAsignable[];
  inicial?: CursoFormInicial;
  puedeAsignarDocentes?: boolean;
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
    fechaFin: inicial?.fechaFin ?? "",
    sede: inicial?.sede ?? "",
    enlaceInscripcion: inicial?.enlaceInscripcion ?? "",
    programaContenidos: inicial?.programaContenidos ?? "",
    programaContenidosHtml: valorInicialEditor(
      inicial?.programaContenidosHtml,
      inicial?.programaContenidos
    ),
    categoria: inicial?.categoria ?? "",
    emoji: inicial?.emoji ?? "",
    cupos: inicial?.cupos != null ? String(inicial.cupos) : "",
    informacionAdicional: inicial?.informacionAdicional ?? "",
  });
  const [activo, setActivo] = useState(inicial?.activo ?? true);
  const [estadoImagen, setEstadoImagen] = useState<EstadoImagen>({
    archivo: null,
    quitar: false,
  });
  const imagenActual = inicial?.imagenUrl ?? null;
  const [docenteIds, setDocenteIds] = useState<number[]>(
    inicial?.docentes.map((d) => d.docenteId) ?? []
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function setCampo(campo: string, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  function sincronizarProgramaContenidos(html: string) {
    setDatos((prev) => ({
      ...prev,
      programaContenidosHtml: html,
      programaContenidos: extraerTextoPlano(html),
    }));
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
    if (datos.fechaFin.trim() !== "") {
      const fecha = new Date(datos.fechaFin);
      if (Number.isNaN(fecha.getTime())) {
        return "La fecha de fin de cursada no es válida.";
      }
      if (!datos.fechaFin.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return "La fecha de fin de cursada debe tener el formato AAAA-MM-DD.";
      }
    }
    if (
      datos.enlaceInscripcion.trim() !== "" &&
      !/^https?:\/\/\S+$/i.test(datos.enlaceInscripcion.trim())
    ) {
      return "El link de inscripción debe ser una URL completa que empiece con http:// o https://.";
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
      let imagenUrl: string | null = imagenActual;
      // URL de una imagen subida en este intento. Si el guardado es rechazado
      // explícitamente, queda sin referencia y se borra para no dejar basura.
      let imagenSubida: string | null = null;
      if (estadoImagen.quitar) {
        imagenUrl = null;
      } else if (estadoImagen.archivo) {
        const errorImagen = validarArchivoImagen(estadoImagen.archivo);
        if (errorImagen) {
          setError(errorImagen);
          return;
        }
        const subida = await subirImagen(estadoImagen.archivo);
        if (!subida.ok) {
          setError(subida.error);
          return;
        }
        imagenUrl = subida.url;
        imagenSubida = subida.url;
      }

      if (esEdicion) {
        const bodyCurso = {
          ...datos,
          imagenUrl: imagenUrl ?? "",
          ...(puedeAsignarDocentes ? { activo } : {}),
        };
        const resCurso = await fetch(`/api/cursos/${inicial!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyCurso),
        });

        if (!resCurso.ok) {
          const data = (await resCurso.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(data?.error ?? "No se pudo guardar el curso.");
          // El servidor rechazó el curso: la imagen nueva no la referencia nadie.
          if (imagenSubida) void eliminarImagenHuerfana(imagenSubida);
          return;
        }

        if (puedeAsignarDocentes) {
          const resDocentes = await fetch(
            `/api/cursos/${inicial!.id}/docentes`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ docenteIds }),
            }
          );

          if (!resDocentes.ok) {
            const data = (await resDocentes.json().catch(() => null)) as {
              error?: string;
            } | null;
            setError(
              data?.error ?? "No se pudieron guardar los docentes asignados."
            );
            // El curso ya quedó guardado con la imagen: no se toca acá.
            return;
          }
        }

        router.push("/panel/cursos");
        router.refresh();
        return;
      }

      const body = {
        ...datos,
        imagenUrl: imagenUrl ?? "",
        activo,
        ...(puedeAsignarDocentes ? { docenteIds } : {}),
      };

      const res = await fetch("/api/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/panel/cursos");
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo guardar el curso.");
      if (imagenSubida) void eliminarImagenHuerfana(imagenSubida);
    } catch {
      // Error de red: no se sabe si el curso se guardó, así que la imagen se
      // deja en pie (queda huérfana y se limpia desde /panel/imagenes).
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
        <span>Emoji / ícono del curso (opcional)</span>
        <input
          type="text"
          value={datos.emoji}
          onChange={(e) => setCampo("emoji", e.target.value)}
          placeholder="Ej: 🤖"
        />
        <small className="form-hint">
          Se muestra junto al curso en el catálogo y en el detalle. Si lo dejás
          vacío, se usa un emoji automático según la categoría.
        </small>
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
        <span>Sede</span>
        <input
          type="text"
          value={datos.sede}
          onChange={(e) => setCampo("sede", e.target.value)}
          placeholder="Ej: Sede CFL 401 - Av. Mitre 200"
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
        <span>Fecha de fin de cursada</span>
        <input
          type="date"
          value={datos.fechaFin}
          onChange={(e) => setCampo("fechaFin", e.target.value)}
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

      <CampoImagen
        valorActual={imagenActual}
        onChange={setEstadoImagen}
        etiqueta="Imagen del curso (opcional)"
      />

      <label className="form-field">
        <span>Link de inscripción en el IPFL (opcional)</span>
        <input
          type="url"
          value={datos.enlaceInscripcion}
          onChange={(e) => setCampo("enlaceInscripcion", e.target.value)}
          placeholder="https://..."
        />
        <small className="form-hint">
          Si se carga, el botón “Inscribirme” del curso lleva a esa página. Si
          queda vacío, el botón lleva a la guía “Cómo inscribirme”.
        </small>
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
        <EditorTextoEnriquecido
          id="curso-programa-contenidos"
          etiqueta="Programa y contenidos"
          valorInicial={datos.programaContenidosHtml}
          minAlto={200}
          onCambio={sincronizarProgramaContenidos}
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

      {puedeAsignarDocentes && (() => {
        // Solo se ofrecen docentes activos para agregar. Los que ya están
        // asignados aparecen igual aunque estén inactivos: así se los puede ver
        // y quitar del curso, en vez de quedar como un docente fantasma que el
        // listado del curso muestra y el formulario no.
        const disponibles = docentes.filter(
          (d) => d.activo || docenteIds.includes(d.id)
        );
        const inactivosAsignados = docentes.filter(
          (d) => !d.activo && docenteIds.includes(d.id)
        );

        return (
          <div className="form-field form-field-full">
            <span>Docentes asignados</span>
            {disponibles.length === 0 ? (
              <p className="form-aviso">
                Todavía no hay docentes activos. Creá usuarios con rol Docente
                para poder asignarlos.
              </p>
            ) : (
              <div className="docentes-box">
                {disponibles.map((docente) => {
                  const asignado = docenteIds.includes(docente.id);
                  return (
                    <label
                      key={docente.id}
                      className={`docente-opt${asignado ? " activo" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={asignado}
                        onChange={() => alternarDocente(docente.id)}
                      />
                      <span>
                        <strong>
                          {docente.nombre} {docente.apellido}
                        </strong>
                        <small>{docente.email}</small>
                        {!docente.activo && (
                          <small className="docente-inactivo">
                            Cuenta desactivada
                          </small>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            {inactivosAsignados.length > 0 && (
              <p className="form-aviso">
                Hay {inactivosAsignados.length} docente
                {inactivosAsignados.length > 1 ? "s" : ""} con la cuenta
                desactivada entre los asignados. Si querés que recuperen el
                acceso al panel, reactivá la cuenta desde Usuarios.
              </p>
            )}
          </div>
        );
      })()}

      {esEdicion && puedeAsignarDocentes && (
        <label className="form-field form-field-full form-toggle">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          <span>Curso activo (visible en el catálogo público)</span>
        </label>
      )}

      <p className="form-error" role="alert" aria-live="assertive">
        {error ?? ""}
      </p>

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