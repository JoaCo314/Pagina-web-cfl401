"use client";

import { useEffect, useRef } from "react";

type PropsEditor = {
  id?: string;
  etiqueta?: string;
  valorInicial?: string | null;
  esObligatorio?: boolean;
  /** Altura mínima (px) del área de escritura. */
  minAlto?: number;
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
  minAlto = 260,
  onCambio,
}: PropsEditor) {
  const areaRef = useRef<HTMLDivElement>(null);
  const ultimoHtml = useRef<string>("");

  /// Aplica el HTML inicial/servidor SOLO cuando cambia desde afuera (p.ej. al
  /// cargar otra noticia) y no es lo que ya hay en el área. No re-escribir el
  /// DOM en cada pasada del componente es lo que preserva el caret, la
  /// selección y el historial nativo de deshacer/rehacer (Ctrl+Z).
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const objetivo = valorInicial ?? "";
    if (objetivo === ultimoHtml.current) return;
    area.innerHTML = objetivo;
    ultimoHtml.current = objetivo;
  }, [valorInicial]);

  function notificar() {
    if (!areaRef.current) return;
    const html = areaRef.current.innerHTML;
    ultimoHtml.current = html;
    onCambio(html);
  }

  function ejecutar(comando: string, valor?: string) {
    areaRef.current?.focus();
    document.execCommand(comando, false, valor);
    notificar();
  }

  /// Aplica un bloque con `execCommand("formatBlock")`. El argumento se acepta
  /// rodeado de `< >` o no: no todos los navegadores lo parsean igual, así que
  /// si una forma falla o devuelve `false` se reintenta con la otra.
  function formatoBloque(etiqueta: string) {
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    const nombre = etiqueta.replace(/[<>]/g, "");
    let ok = false;
    try {
      ok = document.execCommand("formatBlock", false, etiqueta);
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        document.execCommand("formatBlock", false, nombre);
      } catch {
        /* sin efecto */
      }
    }
    notificar();
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
        onMouseDown={(e) => e.preventDefault()}
      >
        <button type="button" title="Deshacer" aria-label="Deshacer" onClick={() => ejecutar("undo")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" />
          </svg>
        </button>
        <button type="button" title="Rehacer" aria-label="Rehacer" onClick={() => ejecutar("redo")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />
          </svg>
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button type="button" title="Negrita" aria-label="Negrita" onClick={() => ejecutar("bold")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>
        <button type="button" title="Cursiva" aria-label="Cursiva" onClick={() => ejecutar("italic")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </button>
        <button type="button" title="Subrayado" aria-label="Subrayado" onClick={() => ejecutar("underline")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 4v6a6 6 0 0 0 12 0V4" />
            <line x1="4" y1="20" x2="20" y2="20" />
          </svg>
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button type="button" title="Título (H2)" aria-label="Título H2" onClick={() => formatoBloque("<h2>")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
          </svg>
          <span className="rte-key">Título</span>
        </button>
        <button type="button" title="Subtítulo (H3)" aria-label="Subtítulo H3" onClick={() => formatoBloque("<h3>")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
          </svg>
          <span className="rte-key">Subtítulo</span>
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button type="button" title="Lista con viñetas" aria-label="Lista con viñetas" onClick={() => ejecutar("insertUnorderedList")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
        <button type="button" title="Lista numerada" aria-label="Lista numerada" onClick={() => ejecutar("insertOrderedList")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </button>
        <button type="button" title="Cita" aria-label="Cita" onClick={() => formatoBloque("<blockquote>")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 6H3" />
            <path d="M21 12H8" />
            <path d="M21 18H8" />
            <path d="M3 12v6" />
          </svg>
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button type="button" title="Insertar enlace" aria-label="Insertar enlace" onClick={insertarEnlace}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
        <button type="button" title="Quitar formato" aria-label="Quitar formato" onClick={() => ejecutar("removeFormat")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l9.6-9.6a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
          </svg>
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
        style={{ minHeight: minAlto }}
        onInput={notificar}
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
