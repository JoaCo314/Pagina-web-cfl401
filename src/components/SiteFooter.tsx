import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <h4>CFL 401 Azul</h4>
            <p style={{ fontSize: 14, opacity: 0.8, maxWidth: 260 }}>
              Cursos y capacitaciones gratuitas y presenciales para fortalecer
              las capacidades de las personas para el trabajo.
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
                <a href="#">Sobre el centro</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Ayuda</h4>
            <ul>
              <li>
                <a href="#">Preguntas frecuentes</a>
              </li>
              <li>
                <a href="#">Noticias</a>
              </li>
              <li>
                <a href="#">Contacto</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li>cfl401azul@gmail.com</li>
              <li>+54 2281 32-3444</li>
              <li>Lunes a viernes de 8:00 a 12:00 y de 14:00 a 22:00</li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Centro de Formación Laboral 401 — Azul</span>
          <span>Maqueta de referencia — no es el sitio oficial</span>
        </div>
      </div>
    </footer>
  );
}