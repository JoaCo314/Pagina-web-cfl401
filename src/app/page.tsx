import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GuiaInscripcion from "@/components/GuiaInscripcion";
import NoticiasHome from "@/components/NoticiasHome";
import { getSiteConfig } from "@/lib/siteConfig";

// Creado por sofia-athos: banner azul editable desde panel/configuracion
export default async function Home() {
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
            {config?.bannerPill ? (
              <div className="pill">
                <span className="dot"></span>{config.bannerPill}
              </div>
            ) : null}
          </div>
          {config?.bannerTitulo ? <h1>{config.bannerTitulo}</h1> : null}
          {config?.bannerSubtitulo ? (
            <p className="lead">{config.bannerSubtitulo}</p>
          ) : null}
          <div className="hero-actions">
            <Link href="/cursos" className="btn-primary">
              Ver oferta de cursos
            </Link>
            <a href="#guia" className="btn-ghost">
              Cómo inscribirme
            </a>
          </div>

          <div className="hero-features">
            <div className="hero-feature">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              <span>Certificación Oficial DGCyE</span>
            </div>
            <div className="hero-feature">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
              <span>100% Gratuito y Público</span>
            </div>
            <div className="hero-feature">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Abierto a la Comunidad</span>
            </div>
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
            <div className="mapa-head">
              <div className="section-head">
                {config?.mapaTitulo && <h2>{config.mapaTitulo}</h2>}
                {config?.mapaSubtitulo && <p>{config.mapaSubtitulo}</p>}
              </div>
              {config?.contactoDireccion && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(config.contactoDireccion)}`}
                  className="btn-ghost-dark btn-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cómo llegar
                </a>
              )}
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
          </div>
        </section>
      )}

      <section className="cta-band" id="oferta">
        <div className="wrap">
          <h2>¿Tenés dudas sobre un curso o tu inscripción?</h2>
          <p>Nuestro equipo te responde de lunes a viernes de 9 a 18 hs.</p>
          <div className="cta-actions">
            <Link href="/preguntas-frecuentes" className="btn-primary">
              Ver preguntas frecuentes
            </Link>
            <Link href="/contacto" className="btn-ghost">
              Contactar al centro
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
