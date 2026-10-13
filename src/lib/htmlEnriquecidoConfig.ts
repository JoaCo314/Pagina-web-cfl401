/// Etiquetas que el editor enriquecido puede guardar y que se permiten al
/// renderizar. Vive en su propio módulo (sin `sanitize-html`) para que también
/// lo pueda importar el componente cliente `HtmlEnriquecido`, que sanea con
/// DOMPurify. Así la lista de etiquetas permitidas es una sola y la
/// sanitización de escritura (servidor) y la de render (cliente) no se
/// desincronizan.
export const ETIQUETAS_HTML_PERMITIDAS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "span",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "code",
  "pre",
] as const;

/// Atributos permitidos por el editor, en formato de allowlist simple para
/// DOMPurify. El servidor los filtra con más detalle (ver `htmlEnriquecido.ts`).
export const ATRIBUTOS_HTML_PERMITIDOS = ["href", "target", "rel", "style"] as const;
