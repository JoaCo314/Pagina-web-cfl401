"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";
import {
  ATRIBUTOS_HTML_PERMITIDOS,
  ETIQUETAS_HTML_PERMITIDAS,
} from "@/lib/htmlEnriquecidoConfig";

/// Allowlist de saneo para el render en el navegador, alineada con la del
/// servidor (`htmlEnriquecido.ts`): mismas etiquetas y atributos, así el saneo
/// de escritura y el de lectura no permiten cosas distintas.
const CONFIG_DOMPURIFY = {
  ALLOWED_TAGS: [...ETIQUETAS_HTML_PERMITIDAS],
  ALLOWED_ATTR: [...ATRIBUTOS_HTML_PERMITIDOS],
};

/// Renderiza contenido enriquecido del panel de forma segura. Si hay HTML
/// guardado (`html`) se sanea con DOMPurify (además del saneo server-side ya
/// aplicado al persistir). Si no hay HTML, se renderiza `textoPlano` dividido
/// en párrafos. Componente cliente para poder usar DOMPurify.
export default function HtmlEnriquecido({
  html,
  textoPlano,
  className = "contenido-enriquecido",
}: {
  html?: string | null;
  textoPlano?: string | null;
  className?: string;
}) {
  const htmlLimpio = useMemo(() => {
    if (!html?.trim()) return null;
    if (typeof window !== "undefined" && typeof DOMPurify?.sanitize === "function") {
      return DOMPurify.sanitize(html, CONFIG_DOMPURIFY);
    }
    return html;
  }, [html]);

  const clases = ["contenido-enriquecido", className].filter(Boolean).join(" ");

  if (htmlLimpio) {
    return <div className={clases} dangerouslySetInnerHTML={{ __html: htmlLimpio }} />;
  }

  const parrafos = (textoPlano ?? "")
    .split(/\n\s*\n/)
    .map((parrafo) => parrafo.trim())
    .filter(Boolean);

  return (
    <div className={clases}>
      {parrafos.length > 0 ? (
        parrafos.map((parrafo, indice) => <p key={indice}>{parrafo}</p>)
      ) : (
        <p>{(textoPlano ?? "").trim()}</p>
      )}
    </div>
  );
}