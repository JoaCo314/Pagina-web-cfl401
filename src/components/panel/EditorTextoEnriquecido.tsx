"use client";

import { useEffect, useRef, useState } from "react";

/// Estado de las propiedades de formato activas sobre el caret/la selección.
/// Se actualiza en cada `selectionchange`/teclado/click para pintar de gris más
/// oscuro el botón de la toolbar correspondiente (así sabés qué formato tiene
/// el texto que estás tocando o editando).
type EstadoActivos = {
  negrita: boolean;
  cursiva: boolean;
  subrayado: boolean;
  listaVinetas: boolean;
  listaNumerada: boolean;
  titulo: boolean;
  subtitulo: boolean;
  cita: boolean;
  enlace: boolean;
  color: string | null;
};

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
  /// Rango de selección guardado antes de abrir el picker de color: al
  /// interactuar con el `<input type="color">` se pierde la selección del
  /// editor, así que se restaura antes de `execCommand("foreColor")` y el color
  /// se aplica exactamente al texto arrastrado.
  const seleccionGuardada = useRef<Range | null>(null);

  /// Botones de la toolbar cuya propiedad está ACTIVA en el caret/la selección
  /// (se marcan con un gris más oscuro). Se refresca con `selectionchange`.
  const [activos, setActivos] = useState<EstadoActivos>({
    negrita: false,
    cursiva: false,
    subrayado: false,
    listaVinetas: false,
    listaNumerada: false,
    titulo: false,
    subtitulo: false,
    cita: false,
    enlace: false,
    color: null,
  });

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
    refrescarActivos();
  }

  /// Refresca qué propiedades del formato están activas sobre el caret/la
  /// selección (según `document.queryCommandState`/`queryCommandValue`). Se
  /// dispara en cada `selectionchange`, teclado y click para mantener marcada
  /// (gris más oscuro) la herramienta correspondiente.
  function refrescarActivos() {
    const area = areaRef.current;
    if (!area) return;
    const activosSiguientes: EstadoActivos = {
      negrita: document.queryCommandState("bold"),
      cursiva: document.queryCommandState("italic"),
      subrayado: document.queryCommandState("underline"),
      listaVinetas: document.queryCommandState("insertUnorderedList"),
      listaNumerada: document.queryCommandState("insertOrderedList"),
      titulo: false,
      subtitulo: false,
      cita: false,
      enlace: false,
      color: null,
    };
    const bloque = String(document.queryCommandValue("formatBlock")).toLowerCase();
    activosSiguientes.titulo = bloque === "h2";
    activosSiguientes.subtitulo = bloque === "h3" || bloque === "h4";
    activosSiguientes.cita = bloque === "blockquote";
    activosSiguientes.enlace = document.queryCommandState("createLink");
    // `foreColor` devuelve el color calculado del texto bajo el caret (p. ej.
    // "rgb(22, 32, 44)" = `--cfl-ink` cuando no se aplicó ninguno). Solo se
    // marca activo si difiere del color heredado del área.
    const colorInk = getComputedStyle(area).color.toLowerCase();
    const colorCaret = String(document.queryCommandValue("foreColor") ?? "").toLowerCase();
    if (colorCaret && colorCaret !== colorInk) {
      activosSiguientes.color = colorCaret;
    }
    setActivos(activosSiguientes);
  }

  /// Registrar los eventos que refrescan los estados activos de la toolbar.
  useEffect(() => {
    function alCambiarSeleccion() {
      window.requestAnimationFrame(refrescarActivos);
    }
    document.addEventListener("selectionchange", alCambiarSeleccion);
    document.addEventListener("keyup", alCambiarSeleccion);
    document.addEventListener("mouseup", alCambiarSeleccion);
    return () => {
      document.removeEventListener("selectionchange", alCambiarSeleccion);
      document.removeEventListener("keyup", alCambiarSeleccion);
      document.removeEventListener("mouseup", alCambiarSeleccion);
    };
  }, []);

  /// Aplica un bloque con `execCommand("formatBlock")`. El argumento se acepta
  /// rodeado de `< >` o no: no todos los navegadores lo parsean igual, así que
  /// si una forma falla o devuelve `false` se reintenta con la otra. Si el
  /// bloque elegido ya está aplicado, lo quita (vuelve a párrafo): así cada
  /// botón funciona como toggle sobre la selección.
  function formatoBloque(etiqueta: string) {
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    const nombre = etiqueta.replace(/[<>]/g, "");
    const bloqueActual = String(document.queryCommandValue("formatBlock")).toLowerCase();
    const objetivo = bloqueActual === nombre.toLowerCase() ? "<p>" : etiqueta;
    let ok = false;
    try {
      ok = document.execCommand("formatBlock", false, objetivo);
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        document.execCommand("formatBlock", false, objetivo.replace(/[<>]/g, ""));
      } catch {
        /* sin efecto */
      }
    }
    notificar();
    refrescarActivos();
  }

  function insertarEnlace() {
    // Toggle: si hay un enlace activo sobre la selección, se quita.
    if (document.queryCommandState("createLink")) {
      ejecutar("unlink");
      return;
    }
    const url = window.prompt("URL del enlace (por ejemplo https://...)");
    if (!url) return;
    const normalizada = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    ejecutar("createLink", normalizada);
  }

  /// Aplica el color elegido al texto seleccionado (o al que se va a escribir).
  function aplicarColor(color: string) {
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    // Restaurar la selección guardada antes de abrir el picker de color.
    const seleccion = window.getSelection();
    const rango = seleccionGuardada.current;
    if (rango) {
      seleccion?.removeAllRanges();
      seleccion?.addRange(rango);
      seleccionGuardada.current = null;
    }
    // `styleWithCSS` hace que `execCommand("foreColor")` escriba
    // `style="color: rgb(...)"` dentro de un `<span>`, que el saneo del lado
    // servidor y DOMPurify saben conservar. Se restaura a `false` después para
    // que negrita/cursiva/subrayado sigan guardándose como `<b>/<i>/<u>`.
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("foreColor", false, color);
    document.execCommand("styleWithCSS", false, "false");
    notificar();
    refrescarActivos();
  }

  /// Convierte `rgb(r, g, b)` (formato que devuelve `queryCommandValue`) a
  /// `#rrggbb`, que es lo único que acepta `<input type="color">`.
  function colorAHex(color: string | null): string {
    if (!color) return "#000000";
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
    const coincidencia = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (!coincidencia) return "#000000";
    const [, r, g, b] = coincidencia;
    const aHex = (n: string) => Number(n).toString(16).padStart(2, "0");
    return `#${aHex(r)}${aHex(g)}${aHex(b)}`;
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
        <button type="button" title="Negrita" aria-label="Negrita" aria-pressed={activos.negrita} className={activos.negrita ? "activo" : undefined} onClick={() => ejecutar("bold")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>
        <button type="button" title="Cursiva" aria-label="Cursiva" aria-pressed={activos.cursiva} className={activos.cursiva ? "activo" : undefined} onClick={() => ejecutar("italic")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </button>
        <button type="button" title="Subrayado" aria-label="Subrayado" aria-pressed={activos.subrayado} className={activos.subrayado ? "activo" : undefined} onClick={() => ejecutar("underline")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 4v6a6 6 0 0 0 12 0V4" />
            <line x1="4" y1="20" x2="20" y2="20" />
          </svg>
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button type="button" title="Título (H2)" aria-label="Título H2" aria-pressed={activos.titulo} className={activos.titulo ? "activo" : undefined} onClick={() => formatoBloque("<h2>")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
          </svg>
          <span className="rte-key">Título</span>
        </button>
        <button type="button" title="Subtítulo (H3)" aria-label="Subtítulo H3" aria-pressed={activos.subtitulo} className={activos.subtitulo ? "activo" : undefined} onClick={() => formatoBloque("<h3>")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
          </svg>
          <span className="rte-key">Subtítulo</span>
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button type="button" title="Lista con viñetas" aria-label="Lista con viñetas" aria-pressed={activos.listaVinetas} className={activos.listaVinetas ? "activo" : undefined} onClick={() => ejecutar("insertUnorderedList")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
        <button type="button" title="Lista numerada" aria-label="Lista numerada" aria-pressed={activos.listaNumerada} className={activos.listaNumerada ? "activo" : undefined} onClick={() => ejecutar("insertOrderedList")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        </button>
        <button type="button" title="Cita" aria-label="Cita" aria-pressed={activos.cita} className={activos.cita ? "activo" : undefined} onClick={() => formatoBloque("<blockquote>")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 6H3" />
            <path d="M21 12H8" />
            <path d="M21 18H8" />
            <path d="M3 12v6" />
          </svg>
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <button type="button" title="Insertar enlace" aria-label="Insertar enlace" aria-pressed={activos.enlace} className={activos.enlace ? "activo" : undefined} onClick={insertarEnlace}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
        <span className="rte-sep" aria-hidden="true" />
        <label
          className={`rte-color${activos.color ? " activo" : ""}`}
          title="Color del texto"
          aria-label="Color del texto"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3s6 6 6 10a6 6 0 1 1-12 0c0-4 6-10 6-10Z" />
            <path d="M4 20h16" />
          </svg>
          <input
            type="color"
            aria-label="Elegir color del texto"
            value={colorAHex(activos.color)}
            onMouseDown={(e) => {
              // Guardar la selección del editor y permitir que el picker nativo
              // se abra (el `onMouseDown` de la toolbar previene el default
              // global para no perder el caret en los otros botones).
              const seleccion = window.getSelection();
              if (seleccion && seleccion.rangeCount > 0) {
                seleccionGuardada.current = seleccion.getRangeAt(0);
              }
              e.stopPropagation();
            }}
            onChange={(e) => aplicarColor(e.target.value)}
          />
        </label>
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
