"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import EditorTextoEnriquecido from "@/components/panel/EditorTextoEnriquecido";
import { extraerTextoPlano, valorInicialEditor } from "@/lib/htmlEnriquecidoUtil";

export type PreguntaFormInicial = {
  id: number;
  pregunta: string;
  respuesta: string;
  respuestaHtml: string | null;
  categoriaId: number;
  orden: number | null;
  activo: boolean;
};

export type CategoriaOpcion = { id: number; nombre: string; activo: boolean };

export default function PreguntaForm({
  inicial,
  categorias,
}: {
  inicial?: PreguntaFormInicial;
  categorias: CategoriaOpcion[];
}) {
  const esEdicion = Boolean(inicial);
  const router = useRouter();

  const [pregunta, setPregunta] = useState(inicial?.pregunta ?? "");
  const [respuesta, setRespuesta] = useState(inicial?.respuesta ?? "");
  const [respuestaHtml, setRespuestaHtml] = useState<string>(
    valorInicialEditor(inicial?.respuestaHtml, inicial?.respuesta)
  );
  const [categoriaId, setCategoriaId] = useState<number>(
    inicial?.categoriaId ?? categorias[0]?.id ?? 0
  );
  const [orden, setOrden] = useState(
    inicial?.orden !== null && inicial?.orden !== undefined
      ? String(inicial.orden)
      : ""
  );
  const [activo, setActivo] = useState(inicial?.activo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function sincronizarRespuesta(html: string) {
    setRespuestaHtml(html);
    setRespuesta(extraerTextoPlano(html));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!pregunta.trim()) {
      setError("La pregunta es obligatoria.");
      return;
    }
    if (!respuesta.trim()) {
      setError("La respuesta es obligatoria.");
      return;
    }
    if (!categoriaId) {
      setError("Elegí una categoría.");
      return;
    }
    if (orden && (!/^\d+$/.test(orden) || Number(orden) < 0)) {
      setError("El orden debe ser un número mayor o igual a 0.");
      return;
    }

    setEnviando(true);
    try {
      const body = {
        pregunta: pregunta.trim(),
        respuesta: respuesta.trim(),
        respuestaHtml: respuestaHtml.trim() || null,
        categoriaId,
        orden: orden ? Number(orden) : null,
        activo,
      };

      const res = await fetch(
        esEdicion ? `/api/preguntas-frecuentes/${inicial!.id}` : "/api/preguntas-frecuentes",
        {
          method: esEdicion ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (res.ok) {
        router.push("/panel/preguntas-frecuentes");
        router.refresh();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo guardar la pregunta.");
    } catch {
      setError("No se pudo guardar la pregunta. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="curso-form" onSubmit={onSubmit} noValidate>
      <div className="panel-form-seccion">
        <div className="form-field form-field-full">
          <span>
            Pregunta <strong>*</strong>
          </span>
          <input
            type="text"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Ej: ¿Cómo me inscribo a un curso?"
          />
        </div>

        <div className="form-field form-field-full">
          <EditorTextoEnriquecido
            id="pregunta-respuesta"
            etiqueta="Respuesta"
            esObligatorio
            valorInicial={respuestaHtml}
            onCambio={sincronizarRespuesta}
          />
        </div>

        <div className="form-field">
          <span>
            Categoría <strong>*</strong>
          </span>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(Number(e.target.value))}
          >
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <span>Orden (opcional)</span>
          <input
            type="text"
            inputMode="numeric"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            placeholder="Ej: 1"
          />
          <small className="form-hint">
            Menor número, primero en aparecer dentro de su categoría.
          </small>
        </div>

        <label className="form-field form-field-full form-toggle">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          <span>Pregunta visible en el sitio público</span>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary btn-sm" disabled={enviando}>
          {enviando
            ? "Guardando…"
            : esEdicion
              ? "Guardar cambios"
              : "Publicar pregunta"}
        </button>
        <a
          href="/panel/preguntas-frecuentes"
          className="btn-ghost-dark"
          onClick={(e) => {
            e.preventDefault();
            router.push("/panel/preguntas-frecuentes");
          }}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}