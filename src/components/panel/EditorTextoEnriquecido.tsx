"use client";

import { useRef } from "react";

type PropsEditor = {
  id?: string;
  etiqueta?: string;
  valorInicial?: string | null;
  esObligatorio?: boolean;
  onCambio: (html: string) => void;
};

/**
 * Editor de texto enriquecido (piloto Opción A) para los campos de contenido de
 * las secciones editables del panel.
 *
 * * Genera HTML con `document.execCommand` (toolbar nativa del navegador);
 *   no depende de librerías pesadas.
 * * El HTML NO se confía: se sanea en el servidor al guardar (sanitize-html)
 *   y se sanea de nuevo con DOMPurify al renderizar en el detalle público.
 * * Además del HTML se guarda el texto plano (para búsqueda/resumen/fallback).
 */
export default function EditorTextoEnriquecido({
  id,
  etiqueta = "Contenido",
  valorInicial,
  esObligatorio,
  onCambio,
}: PropsEditor) {
  const areaRef = useRef<HTMLDivElement>(null);

  function ejecutar(comando: string, valor?: string) {
    areaRef.current?.focus();
    document.execCommand(comando, false, valor);
    notificar();
  }

  function notificar() {
    if (!areaRef.current) return;
    onCambio(areaRef.current.innerHTML);
  }

  function insertarEnlace() {
    const url = window.prompt("URL del enlace (por ejemplo https://...)");
    if (!url) return;
    const normalizada = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    ejecutar("createLink", normalizada);
  }

  return (
    <div className="rte">
      <div
        className="rte-toolbar"
        role="toolbar"
        aria-label={`Opciones de formato de ${etiqueta.toLowerCase()}`}
      >
        <button type="button" title="Negrita" aria-label="Negrita" onClick={() => ejecutar("bold")}>
          <strong>B</strong>
        </button>
        <button type="button" title="Cursiva" aria-label="Cursiva" onClick={() => ejecutar("italic")}>
          <em>I</em>
        </button>
        <button type="button" title="Subrayado" aria-label="Subrayado" onClick={() => ejecutar("underline")}>
          <u>U</u>
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button type="button" title="Título (H2)" aria-label="Título H2" onClick={() => ejecutar("formatBlock", "<h2>")}>
          Título
        </button>
        <button type="button" title="Subtítulo (H3)" aria-label="Subtítulo H3" onClick={() => ejecutar("formatBlock", "<h3>")}>
          Subtítulo
        </button>
        <button type="button" title="Párrafo" aria-label="Párrafo normal" onClick={() => ejecutar("formatBlock", "<p>")}>
          ¶
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button type="button" title="Lista con viñetas" aria-label="Lista con viñetas" onClick={() => ejecutar("insertUnorderedList")}>
          • Lista
        </button>
        <button type="button" title="Lista numerada" aria-label="Lista numerada" onClick={() => ejecutar("insertOrderedList")}>
          1. Lista
        </button>
        <button type="button" title="Cita" aria-label="Cita" onClick={() => ejecutar("formatBlock", "<blockquote>")}>
          “Cita”
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button type="button" title="Insertar enlace" aria-label="Insertar enlace" onClick={insertarEnlace}>
          🔗 Enlace
        </button>
        <button type="button" title="Quitar formato" aria-label="Quitar formato" onClick={() => ejecutar("removeFormat")}>
          Quitar formato
        </button>
      </div>

      <div
        id={id}
        ref={areaRef}
        className="rte-area form-field-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={etiqueta}
        data-placeholder={`Escribí el ${etiqueta.toLowerCase()}… Podés usar el formato de la barra.`}
        onInput={notificar}
        dangerouslySetInnerHTML={{ __html: valorInicial || "" }}
      />
      {esObligatorio && (
        <small className="form-hint">
          Campo obligatorio. El texto se guarda en formato enriquecido y se
          valida en el servidor antes de publicarse.
        </small>
      )}
    </div>
  );
}
