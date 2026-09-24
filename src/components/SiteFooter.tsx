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
            <h4>{config?.footerCflTitulo ?? "CFL 401 Azul"}</h4>
            <p style={{ fontSize: 14, opacity: 0.8, maxWidth: 260 }}>
              {config?.footerCflTexto ?? "Cursos y capacitaciones gratuitas y presenciales para fortalecer las capacidades de las personas para el trabajo."}
            </p>
          </div>
          <div>
            <h4>Explorar</h4>
            <ul>
              <li>
                <Link href="/cursos">Cursos</Link>
              </li>
              <li>
                <a href="#">Docentes</a>
              </li>
              <li>
                <Link href="/sobre-el-centro">Sobre el centro</Link>
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
                <Link href="/noticias">Noticias</Link>
              </li>
              <li>
                <Link href="/contacto">Contacto</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>{config?.footerContactosTitulo ?? "Contacto"}</h4>
            <ul>
              <li>{config?.footerEmail ?? "cfl401azul@gmail.com"}</li>
              <li>{config?.footerTelefono ?? "+54 2281 32-3444"}</li>
              {config?.footerDireccion && <li>{config.footerDireccion}</li>}
              <li>{config?.footerHorarios ?? "Lunes a viernes de 8:00 a 12:00 y de 14:00 a 22:00"}</li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>{config?.footerCopy ?? "© 2026 Centro de Formación Laboral 401 — Azul"}</span>
          <span>Maqueta de referencia — no es el sitio oficial</span>
        </div>
      </div>
    </footer>
  );
}