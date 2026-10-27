import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContactoForm from "@/components/ContactoForm";
import { getSiteConfig } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contacto",
  description:
    "Escribinos por el formulario de contacto del CFL 401 Azul: dirección, teléfono, horarios y medios de consulta.",
};

// Creado por sofia-athos - Página /contacto funcional y editable desde panel/configuracion
export default async function ContactoPage() {
  const config = await getSiteConfig().catch(() => null);

  return (
    <>
      <SiteHeader active="contacto" />
      <div className="page-header" id="contenido" tabIndex={-1}>
        <div className="wrap">
          <h1>{config?.contactoTitulo ?? "Contacto"}</h1>
          {config?.contactoSubtitulo ? <p>{config.contactoSubtitulo}</p> : null}
        </div>
      </div>
      <main className="wrap contacto-main">
        <div className="contacto-grid">
          <div className="contacto-info-column">
            <h2>Canales de atención</h2>
            <p className="contacto-info-lead">
              Comunicate con el equipo administrativo del CFL 401 por cualquiera
              de nuestras vías oficiales:
            </p>

            <div className="contacto-cards-list">
              {config?.contactoDireccion && (
                <div className="contacto-card-item">
                  <div className="contacto-card-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="contacto-card-body">
                    <strong>Dirección</strong>
                    <span>{config.contactoDireccion}</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(config.contactoDireccion)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contacto-card-link"
                    >
                      Cómo llegar en Google Maps ↗
                    </a>
                  </div>
                </div>
              )}

              {config?.contactoTelefono && (
                <div className="contacto-card-item">
                  <div className="contacto-card-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div className="contacto-card-body">
                    <strong>Teléfono</strong>
                    <a
                      href={`tel:${config.contactoTelefono.replace(/\s+/g, "")}`}
                      className="contacto-card-value"
                    >
                      {config.contactoTelefono}
                    </a>
                  </div>
                </div>
              )}

              {config?.contactoEmail && (
                <div className="contacto-card-item">
                  <div className="contacto-card-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div className="contacto-card-body">
                    <strong>Correo electrónico</strong>
                    <a
                      href={`mailto:${config.contactoEmail}`}
                      className="contacto-card-value"
                    >
                      {config.contactoEmail}
                    </a>
                  </div>
                </div>
              )}

              {config?.contactoHorarios && (
                <div className="contacto-card-item">
                  <div className="contacto-card-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="contacto-card-body">
                    <strong>Horarios de atención</strong>
                    <span>{config.contactoHorarios}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="contacto-form-column">
            <h2>Envianos un mensaje</h2>
            <p className="contacto-info-lead">
              Completá el formulario y te responderemos a la brevedad:
            </p>
            <ContactoForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
