import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FaqList, { type FaqCategoria } from "@/components/FaqList";
import { prisma } from "@/lib/prisma";
import { sanitizarHtmlLectura } from "@/lib/htmlEnriquecido";

export const metadata = {
  title: "Preguntas frecuentes",
  description:
    "Respuestas a las dudas más comunes sobre inscripción, cursada y documentación en el CFL 401 Azul.",
};

export const dynamic = "force-dynamic";

export default async function PreguntasFrecuentesPage() {
  const categorias = await prisma.categoriaPregunta.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      preguntas: {
        where: { activo: true },
        select: {
        id: true,
        pregunta: true,
        respuesta: true,
        respuestaHtml: true,
      },
        orderBy: [{ orden: "asc" }, { pregunta: "asc" }],
      },
    },
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
  });

  const visibles: FaqCategoria[] = categorias
    .filter((c) => c.preguntas.length > 0)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      preguntas: c.preguntas.map((p) => ({
        ...p,
        // Saneo de lectura: FaqList renderiza este HTML con DOMPurify en el
        // navegador, pero en SSR lo dejaría salir tal cual. Se vuelve a filtrar
        // acá con las mismas reglas que al guardar.
        respuestaHtml: p.respuestaHtml
          ? sanitizarHtmlLectura(p.respuestaHtml)
          : null,
      })),
    }));

  return (
    <>
      <SiteHeader active="faq" />

      <div className="page-header" id="contenido" tabIndex={-1}>
        <div className="wrap">
          <h1>Preguntas frecuentes</h1>
          <p>
            Respuestas a las dudas más comunes sobre inscripción, cursada y
            documentos.
          </p>
        </div>
      </div>

      <div className="faq-section">
        <div className="wrap">
          {visibles.length > 0 ? (
            <FaqList categorias={visibles} />
          ) : (
            <section className="sobre-section sobre-section-vacio">
              <div className="section-head">
                <h2>Todavía no hay preguntas publicadas</h2>
                <p>
                  Muy pronto vas a encontrar acá las respuestas a las dudas más
                  frecuentes del Centro. Si tenés una consulta, escribinos.
                </p>
                <Link href="/contacto" className="btn-primary">
                  Hacer una consulta
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>

      <section className="cta-band" id="contacto">
        <div className="wrap">
          <h2>¿No encontraste tu respuesta?</h2>
          <p>
            Podés consultarnos directamente a través de nuestro formulario de
            contacto o consultarle a nuestro asistente virtual.
          </p>
          <div className="cta-actions">
            <Link href="/contacto" className="btn-primary">
              Hacer una consulta
            </Link>
            <Link href="/cursos" className="btn-ghost">
              Ver oferta de cursos
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}