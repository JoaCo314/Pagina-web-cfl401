import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FaqPageContent from "@/components/FaqPageContent";

export const metadata = {
  title: "Preguntas Frecuentes — CFL 401 Azul",
};

export default function PreguntasFrecuentesPage() {
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
        <FaqPageContent />
      </div>

      <section className="cta-band" id="contacto">
        <div className="wrap">
          <h2>¿No encontraste tu respuesta?</h2>
          <p>Escribinos y te ayudamos con tu consulta.</p>
          <Link href="/cursos" className="btn-primary">
            Ver oferta de cursos
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
