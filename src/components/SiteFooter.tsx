import Link from "next/link";
import { getSiteConfig } from "@/lib/siteConfig";

// Creado por sofia-athos: footer editable desde panel/configuracion
export default async function SiteFooter() {
  const config = await getSiteConfig().catch(() => null);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <h4>{config?.footerCflTitulo ?? ""}</h4>
            {config?.footerCflTexto ? (
              <p className="foot-texto">{config.footerCflTexto}</p>
            ) : null}
          </div>
          <div>
            <h4>Explorar</h4>
            <ul>
              <li>
                <Link href="/cursos">Cursos</Link>
              </li>
              <li>
                <Link href="/sobre-el-centro">Sobre el centro</Link>
              </li>
              <li>
                <Link href="/noticias">Noticias</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Ayuda</h4>
            <ul>
              <li>
                <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
              </li>
              <li>
                <Link href="/contacto">Contacto</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>{config?.footerContactosTitulo ?? ""}</h4>
            <ul>
              {config?.footerEmail ? <li>{config.footerEmail}</li> : null}
              {config?.footerTelefono ? <li>{config.footerTelefono}</li> : null}
              {config?.footerDireccion && <li>{config.footerDireccion}</li>}
              {config?.footerHorarios ? <li>{config.footerHorarios}</li> : null}
            </ul>
          </div>
        </div>
<div className="foot-bottom">
          {config?.footerCopy ? <span>{config.footerCopy}</span> : null}
        </div>
      </div>
    </footer>
  );
}