import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GuiaInscripcion from "@/components/GuiaInscripcion";
import NoticiasHome from "@/components/NoticiasHome";
import { getSiteConfig } from "@/lib/siteConfig";

// Creado por sofia-athos: banner azul editable desde panel/configuracion
export default async function Home() {
  const anio = new Date().getFullYear();
  const config = await getSiteConfig().catch(() => null);

  return (
    <>
      <SiteHeader />

      <section
        className="hero"
        id="contenido"
        tabIndex={-1}
        style={
          config?.bannerImagenUrl
            ? {
                backgroundImage: `linear-gradient(rgba(0,61,128,0.85), rgba(0,61,128,0.85)), url(${config.bannerImagenUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="wrap">
          <div className="badge-row">
            <div className="pill">
              <span className="dot"></span>{config?.bannerPill ?? `Preinscripción ${anio} abierta`}
            </div>
          </div>
          <h1>{config?.bannerTitulo ?? "Capacitate en un oficio, gratis y cerca de casa."}</h1>
          <p className="lead">{config?.bannerSubtitulo ?? "Cursos presenciales dictados por profesionales en actividad. Elegí tu curso, consultá cupos y horarios, e inscribite en minutos."}</p>
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

      {config?.mapaUrl && (
        <section className="mapa-section" id="ubicacion">
          <div className="wrap">
            <div className="section-head">
              <h2>¿Dónde estamos?</h2>
              <p>
                {config?.contactoDireccion ?? "Azul, Provincia de Buenos Aires"}
                {config?.contactoHorarios ? ` · ${config.contactoHorarios}` : ""}
              </p>
            </div>
            <div className="mapa-frame">
              <iframe
                src={config.mapaUrl}
                title="Ubicación del CFL 401"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mapa-actions">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(config?.contactoDireccion ?? "Azul, Provincia de Buenos Aires")}`}
                className="btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cómo llegar
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="cta-band" id="oferta">
        <div className="wrap">
          <h2>¿Tenés dudas sobre un curso o tu inscripción?</h2>
          <p>Nuestro equipo te responde de lunes a viernes de 9 a 18 hs.</p>
          <Link href="/preguntas-frecuentes" className="btn-primary">
            Ver preguntas frecuentes
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}