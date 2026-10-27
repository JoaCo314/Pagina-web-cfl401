import Link from "next/link";
import { getSiteConfig } from "@/lib/siteConfig";

// Creado por sofia-athos: footer editable desde panel/configuracion
export default async function SiteFooter() {
  const config = await getSiteConfig().catch(() => null);
  const anio = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <h4>{config?.footerCflTitulo || "CFL 401 Azul"}</h4>
            {config?.footerCflTexto ? (
              <p className="foot-texto">{config.footerCflTexto}</p>
            ) : (
              <p className="foot-texto">
                Centro de Formación Laboral N° 401. Formación profesional pública,
                gratuita y con validez oficial en Azul, Buenos Aires.
              </p>
            )}
          </div>
          <div>
            <h4>Explorar</h4>
            <ul>
              <li>
                <Link href="/cursos">Cursos y capacitaciones</Link>
              </li>
              <li>
                <Link href="/sobre-el-centro">Sobre el centro</Link>
              </li>
              <li>
                <Link href="/noticias">Noticias y novedades</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Ayuda y orientación</h4>
            <ul>
              <li>
                <Link href="/#guia">Guía de inscripción</Link>
              </li>
              <li>
                <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
              </li>
              <li>
                <Link href="/contacto">Contacto y ubicación</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>{config?.footerContactosTitulo || "Atención al aspirante"}</h4>
            <ul>
              {config?.footerEmail ? (
                <li>
                  <a href={`mailto:${config.footerEmail}`}>{config.footerEmail}</a>
                </li>
              ) : null}
              {config?.footerTelefono ? (
                <li>
                  <a href={`tel:${config.footerTelefono.replace(/\s+/g, "")}`}>
                    {config.footerTelefono}
                  </a>
                </li>
              ) : null}
              {config?.footerDireccion && <li>{config.footerDireccion}</li>}
              {config?.footerHorarios ? <li>{config.footerHorarios}</li> : null}
            </ul>
          </div>
        </div>

        <div className="foot-bottom">
          <div className="foot-bottom-inner">
            <div className="foot-institutional">
              <span>
                Dirección General de Cultura y Educación · Gobierno de la Provincia de Buenos Aires
              </span>
              <span>·</span>
              <span>Instituto Provincial de Formación Laboral (IPFL)</span>
            </div>
            <div className="foot-legal">
              <span>
                {config?.footerCopy || `© ${anio} CFL 401 Azul. Todos los derechos reservados.`}
              </span>
              <Link href="/panel/login" className="foot-admin-link">
                Acceso del equipo docente y administrativo →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
