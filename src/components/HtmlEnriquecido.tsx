"use client";

import DOMPurify from "dompurify";

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
  const htmlLimpio = html?.trim() ? DOMPurify.sanitize(html) : null;
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