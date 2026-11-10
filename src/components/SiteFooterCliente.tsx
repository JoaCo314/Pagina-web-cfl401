"use client";

import Link from "next/link";

export type SiteFooterClienteProps = {
  footerCflTitulo?: string | null;
  footerCflTexto?: string | null;
  footerContactosTitulo?: string | null;
  footerEmail?: string | null;
  footerTelefono?: string | null;
  footerDireccion?: string | null;
  footerHorarios?: string | null;
  footerCopy?: string | null;
};

export default function SiteFooterCliente({
  footerCflTitulo,
  footerCflTexto,
  footerContactosTitulo,
  footerEmail = "cfl401azul@gmail.com",
  footerTelefono = "+54 2281 32-3444",
  footerDireccion = "Azul, Provincia de Buenos Aires",
  footerHorarios = "Lunes a viernes de 8:00 a 12:00 y de 14:00 a 22:00",
  footerCopy,
}: SiteFooterClienteProps) {
  const anio = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <h4>{footerCflTitulo || "CFL 401 Azul"}</h4>
            {footerCflTexto ? (
              <p className="foot-texto">{footerCflTexto}</p>
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
            <h4>{footerContactosTitulo || "Atención al aspirante"}</h4>
            <ul>
              {footerEmail ? (
                <li>
                  <a href={`mailto:${footerEmail}`}>{footerEmail}</a>
                </li>
              ) : null}
              {footerTelefono ? (
                <li>
                  <a href={`tel:${footerTelefono.replace(/\s+/g, "")}`}>
                    {footerTelefono}
                  </a>
                </li>
              ) : null}
              {footerDireccion && <li>{footerDireccion}</li>}
              {footerHorarios ? <li>{footerHorarios}</li> : null}
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
                {footerCopy || `© ${anio} CFL 401 Azul. Todos los derechos reservados.`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
