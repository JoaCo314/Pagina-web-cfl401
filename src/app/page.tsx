import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GuiaInscripcion from "@/components/GuiaInscripcion";
import NoticiasHome from "@/components/NoticiasHome";

export default function Home() {
  const anio = new Date().getFullYear();

  return (
    <>
      <SiteHeader />

      <section className="hero" id="contenido" tabIndex={-1}>
        <div className="wrap">
          <div className="badge-row">
            <div className="pill">
              <span className="dot"></span>Preinscripción {anio} abierta
            </div>
          </div>
          <h1>Capacitate en un oficio, gratis y cerca de casa.</h1>
          <p className="lead">
            Cursos presenciales dictados por profesionales en actividad. Elegí
            tu curso, consultá cupos y horarios, e inscribite en minutos.
          </p>
          <div className="hero-actions">
            <Link href="/cursos" className="btn-primary">
              Ver oferta de cursos
            </Link>
            <a href="#guia" className="btn-ghost">
              Cómo inscribirme
            </a>
          </div>
        </div>
      </section>

      <section className="guia-section" id="guia">
        <div className="wrap">
          <div className="section-head">
            <h2>¿Cómo inscribirme?</h2>
            <p>
              Seguí estos pasos y presentá la documentación requerida. La
              inscripción es gratuita y abierta a toda la comunidad.
            </p>
          </div>
          <GuiaInscripcion />
        </div>
      </section>

      <NoticiasHome />

      <section className="cta-band" id="oferta">
        <div className="wrap">
          <h2>¿Tenés dudas sobre un curso o tu inscripción?</h2>
          <p>Nuestro equipo te responde de lunes a viernes de 9 a 18 hs.</p>
          <Link href="/cursos" className="btn-primary">
            Explorar la oferta educativa
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}