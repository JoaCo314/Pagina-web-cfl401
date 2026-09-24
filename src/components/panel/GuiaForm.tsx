"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import EditorTextoEnriquecido from "@/components/panel/EditorTextoEnriquecido";
import { extraerTextoPlano, htmlDesdeTextoPlano } from "@/lib/htmlEnriquecidoUtil";

export type BloqueGuia = {
  clave: string;
  titulo: string;
  contenido: string;
  contenidoHtml: string;
};

const MAX_TITULO = 200;

export default function GuiaForm({ bloques }: { bloques: BloqueGuia[] }) {
  const router = useRouter();
  const [datos, setDatos] = useState<BloqueGuia[]>(bloques);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function setCampo(
    clave: string,
    campo: "titulo" | "contenido" | "contenidoHtml",
    valor: string
  ) {
    setDatos((prev) =>
      prev.map((b) => (b.clave === clave ? { ...b, [campo]: valor } : b))
    );
    setGuardado(false);
  }

  function sincronizarContenido(clave: string, html: string) {
    setDatos((prev) =>
      prev.map((b) =>
        b.clave === clave
          ? { ...b, contenidoHtml: html, contenido: extraerTextoPlano(html) }
          : b
      )
    );
    setGuardado(false);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    for (const bloque of datos) {
      if (!bloque.titulo.trim()) {
        setError(`El título "${bloque.clave}" no puede estar vacío.`);
        return;
      }
      if (!bloque.contenido.trim()) {
        setError(`El contenido del bloque "${bloque.clave}" no puede estar vacío.`);
        return;
      }
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/guia-inscripcion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenidos: datos }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo guardar la guía.");
        return;
      }

      const data = (await res.json()) as {
        contenidos?: {
          clave: string;
          titulo: string;
          contenido: string;
          contenidoHtml: string | null;
        }[];
      };

      if (Array.isArray(data.contenidos)) {
        setDatos(
          data.contenidos.map((c) => ({
            clave: c.clave,
            titulo: c.titulo,
            contenido: c.contenido,
            contenidoHtml: c.contenidoHtml ?? "",
          }))
        );
      }

      setGuardado(true);
      router.refresh();
    } catch {
      setError("No se pudo guardar la guía. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      {guardado && (
        <p className="form-ok">
          La guía se guardó correctamente. Los cambios ya están visibles en la
          sección pública.
        </p>
      )}

      <form className="guia-form" onSubmit={onSubmit} noValidate>
        {datos.map((bloque) => (
          <fieldset key={bloque.clave} className="guia-bloque">
            <legend>{bloque.clave.replace(/_/g, " ")}</legend>

            <label className="form-field">
              <span>Título</span>
              <input
                type="text"
                maxLength={MAX_TITULO}
                value={bloque.titulo}
                onChange={(e) =>
                  setCampo(bloque.clave, "titulo", e.target.value)
                }
              />
              <small className="guia-contador">
                {bloque.titulo.length}/{MAX_TITULO}
              </small>
            </label>

            <div className="form-field">
              <EditorTextoEnriquecido
                id={`guia-contenido-${bloque.clave}`}
                etiqueta="Contenido"
                valorInicial={
                  bloque.contenidoHtml ||
                  htmlDesdeTextoPlano(bloque.contenido)
                }
                onCambio={(html) => sincronizarContenido(bloque.clave, html)}
              />
            </div>
          </fieldset>
        ))}

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary btn-sm"
            disabled={enviando}
          >
            {enviando ? "Guardando…" : "Guardar guía"}
          </button>
          <a
            href="/panel"
            className="btn-ghost-dark"
            onClick={(e) => {
              e.preventDefault();
              router.push("/panel");
            }}
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}