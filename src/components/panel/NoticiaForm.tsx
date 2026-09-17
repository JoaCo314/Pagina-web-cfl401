"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type NoticiaFormInicial = {
  id: number;
  titulo: string;
  resumen: string | null;
  contenido: string;
  fecha: string;
  imagenUrl: string | null;
  activo: boolean;
};

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NoticiaForm({
  inicial,
}: {
  inicial?: NoticiaFormInicial;
}) {
  const esEdicion = Boolean(inicial);
  const router = useRouter();

  const [datos, setDatos] = useState({
    titulo: inicial?.titulo ?? "",
    resumen: inicial?.resumen ?? "",
    contenido: inicial?.contenido ?? "",
    fecha: inicial?.fecha ?? hoyISO(),
    imagenUrl: inicial?.imagenUrl ?? "",
  });
  const [activo, setActivo] = useState(inicial?.activo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function setCampo(campo: string, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  function validarFront(): string | null {
    if (!datos.titulo.trim()) {
      return "El título de la noticia es obligatorio.";
    }
    if (!datos.contenido.trim()) {
      return "El contenido de la noticia es obligatorio.";
    }
    if (!datos.fecha.trim()) {
      return "La fecha de publicación es obligatoria.";
    }
    if (!datos.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return "La fecha de publicación debe tener el formato AAAA-MM-DD.";
    }
    if (Number.isNaN(new Date(datos.fecha).getTime())) {
      return "La fecha de publicación no es válida.";
    }
    if (
      datos.imagenUrl.trim() !== "" &&
      !/^https?:\/\/\S+$/i.test(datos.imagenUrl.trim())
    ) {
      return "La URL de la imagen debe ser completa y empezar con http:// o https://.";
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
      const body = { ...datos, activo };

      const res = await fetch(
        esEdicion ? `/api/noticias/${inicial!.id}` : "/api/noticias",
        {
          method: esEdicion ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        router.push("/panel/noticias");
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo guardar la noticia.");
    } catch {
      setError("No se pudo guardar la noticia. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="curso-form" onSubmit={onSubmit} noValidate>
      <label className="form-field form-field-full">
        <span>
          Título <strong>*</strong>
        </span>
        <input
          type="text"
          value={datos.titulo}
          onChange={(e) => setCampo("titulo", e.target.value)}
          placeholder="Ej: Ya está abierta la preinscripción a los cursos 2026"
        />
      </label>

      <label className="form-field">
        <span>
          Fecha de publicación <strong>*</strong>
        </span>
        <input
          type="date"
          value={datos.fecha}
          onChange={(e) => setCampo("fecha", e.target.value)}
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
        <span>Resumen (opcional)</span>
        <textarea
          rows={2}
          value={datos.resumen}
          onChange={(e) => setCampo("resumen", e.target.value)}
          placeholder="Bajada breve que se muestra en la tarjeta del listado"
        />
      </div>

      <div className="form-field form-field-full">
        <span>
          Contenido <strong>*</strong>
        </span>
        <textarea
          rows={10}
          value={datos.contenido}
          onChange={(e) => setCampo("contenido", e.target.value)}
          placeholder="Cuerpo de la noticia. Separá los párrafos con un renglón en blanco."
        />
        <small className="form-hint">
          Admite texto plano con saltos de línea; se muestran respetando los
          párrafos.
        </small>
      </div>

      {esEdicion && (
        <label className="form-field form-field-full form-toggle">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          <span>Noticia publicada (visible en el sitio público)</span>
        </label>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary btn-sm" disabled={enviando}>
          {enviando
            ? "Guardando…"
            : esEdicion
              ? "Guardar cambios"
              : "Publicar noticia"}
        </button>
        <a
          href="/panel/noticias"
          className="btn-ghost-dark"
          onClick={(e) => {
            e.preventDefault();
            router.push("/panel/noticias");
          }}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
