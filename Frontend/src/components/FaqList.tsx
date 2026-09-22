"use client";

import { useState } from "react";

export type FaqCategoria = {
  id: number;
  nombre: string;
  preguntas: { id: number; pregunta: string; respuesta: string }[];
};

export default function FaqList({ categorias }: { categorias: FaqCategoria[] }) {
  const [abiertas, setAbiertas] = useState<number[]>([]);

  function toggle(id: number) {
    setAbiertas((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  return (
    <div className="faq-wrap">
      {categorias.map((categoria) => (
        <section key={categoria.id} className="faq-categoria">
          <h2>{categoria.nombre}</h2>
          <div className="faq-lista">
            {categoria.preguntas.map((pregunta) => {
              const abierta = abiertas.includes(pregunta.id);
              return (
                <div key={pregunta.id} className="faq-item">
                  <button
                    type="button"
                    className="faq-pregunta"
                    aria-expanded={abierta}
                    aria-controls={`faq-respuesta-${pregunta.id}`}
                    onClick={() => toggle(pregunta.id)}
                  >
                    <span>{pregunta.pregunta}</span>
                    <span className="faq-icon" aria-hidden="true" />
                  </button>
                  <div
                    id={`faq-respuesta-${pregunta.id}`}
                    className={`faq-respuesta${abierta ? " abierta" : ""}`}
                  >
                    <p>{pregunta.respuesta}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}