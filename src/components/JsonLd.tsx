import type { JSX } from "react";

type JsonLdProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Record<string, any> | Array<Record<string, any>>;
};

/**
 * Componente para renderizar datos estructurados (Schema.org) en formato JSON-LD.
 * Sanitiza los caracteres '<' para prevenir rupturas prematuras o inyecciones
 * dentro de la etiqueta <script>.
 */
export default function JsonLd({ schema }: JsonLdProps): JSX.Element {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
