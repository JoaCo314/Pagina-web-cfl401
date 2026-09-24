import sanitizeHtml from "sanitize-html";

/// Etiquetas y atributos que el editor enriquecido puede guardar. Todo lo que
/// no esté acá se descarta en el servidor (RF-17: sanitización server-side).
/// El HTML guardado es canónico: Firefox escribe `b`/`i` con `execCommand`
/// (en vez de `strong`/`em`) y también puede emitir `span` con `style`;
/// `transformTags` los normaliza ANTES del filtro de etiquetas permitidas,
/// así el formato se conserva y el texto se guarda siempre con `<strong>`/`<em>`.
export const ETIQUETAS_HTML_PERMITIDAS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
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

/// Sanitiza el HTML que envía el editor del panel antes de persistir. Devuelve
/// el HTML limpio, o `null` si el campo venía vacío/ausente.
export function limpiarHtmlEnriquecido(
  valor: unknown,
  campo: string,
  max: number
): { error?: string; valor: string | null } {
  if (valor === undefined || valor === null) return { valor: null };
  if (typeof valor !== "string") {
    return { error: `El campo ${campo} debe ser una cadena de texto.`, valor: null };
  }
  const texto = valor.trim();
  if (!texto) return { valor: null };

  const htmlLimpio = sanitizeHtml(texto, {
    allowedTags: [...ETIQUETAS_HTML_PERMITIDAS],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      ...(["h2", "h3", "h4", "p", "ul", "ol", "li", "blockquote", "code", "pre"].reduce(
        (acc, etiqueta) => ({ ...acc, [etiqueta]: [] }),
        {}
      )),
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      b: () => ({ tagName: "strong", attribs: {} }),
      i: () => ({ tagName: "em", attribs: {} }),
      // Firefox/Chrome separan párrafos con `<div>` dentro de contenteditable;
      // se convierten a `<p>` para que el guardado sea semántico y el render
      // público coincida con lo que se vio en el editor.
      div: () => ({ tagName: "p", attribs: {} }),
      span: (_nombre, atributos) => {
        const estilo = (atributos.style || "").toLowerCase();
        if (/\bfont-weight\b/.test(estilo)) return { tagName: "strong", attribs: {} };
        if (/\bfont-style\b/.test(estilo)) return { tagName: "em", attribs: {} };
        if (estilo.includes("underline")) return { tagName: "u", attribs: {} };
        if (estilo.includes("line-through")) return { tagName: "s", attribs: {} };
        // `span` no está permitido: se descarta conservando el texto interior.
        return { tagName: "span", attribs: {} };
      },
      a: (nombre, atributos) => ({
        tagName: "a",
        attribs: {
          ...atributos,
          rel: "noopener noreferrer",
          ...(atributos.target === "_blank" ? {} : { target: "_blank" }),
        },
      }),
    },
  });

  if (htmlLimpio.length > max) {
    return {
      error: `El campo ${campo} no puede superar ${max} caracteres.`,
      valor: null,
    };
  }

  return { valor: htmlLimpio };
}