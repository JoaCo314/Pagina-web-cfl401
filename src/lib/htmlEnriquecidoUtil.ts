/// Utilidades del editor de texto enriquecido que se usan EXCLUSIVAMENTE en
/// componentes cliente (formularios del panel). Viven en un archivo aparte de
/// `htmlEnriquecido.ts` para no arrastrar `sanitize-html` (solo servidor) al
/// bundle del navegador.

/// Convierte un texto plano (con párrafos separados por líneas en blanco) en
/// párrafos HTML escapados. Se usa como valor inicial del editor cuando el
/// registro todavía no tiene contenido enriquecido (`*Html` nulo), para que el
/// texto previo no quede pegado en un solo bloque al editar.
export function htmlDesdeTextoPlano(texto: string): string {
  const escapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escapado
    .split(/\n\s*\n/)
    .map((parrafo) => parrafo.trim())
    .filter(Boolean)
    .map((parrafo) => `<p>${parrafo}</p>`)
    .join("");
}

/// Valor inicial del editor para un campo: prioriza el HTML guardado; si no
/// hay, convierte el texto plano existente en párrafos HTML.
export function valorInicialEditor(
  html: string | null | undefined,
  texto: string | null | undefined
): string {
  if (html && html.trim()) return html;
  return htmlDesdeTextoPlano(texto ?? "");
}

/// Extrae el texto plano desde el HTML del editor, para mantener sincronizado
/// el campo de texto simple (usado en listados, cards y fragmentos donde no se
/// quiere renderizar HTML). SOLO se usa en el navegador (`document`).
export function extraerTextoPlano(html: string): string {
  const recipiente = document.createElement("div");
  recipiente.innerHTML = html;
  return (recipiente.textContent ?? "").trim();
}