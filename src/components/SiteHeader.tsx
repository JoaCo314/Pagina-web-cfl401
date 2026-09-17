import Link from "next/link";

type SiteHeaderProps = {
  active?: string;
};

const NAV_ITEMS = [
  { label: "Cursos", href: "/cursos", key: "cursos" },
  { label: "Docentes", href: "#", key: "docentes" },
  { label: "Sobre el centro", href: "#", key: "sobre" },
  { label: "Noticias", href: "#", key: "noticias" },
  { label: "Preguntas frecuentes", href: "#", key: "faq" },
  { label: "Contacto", href: "#", key: "contacto" },
];

export default function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <div className="topbar-badges">
            <span>
              <span className="dot" /> Cursos 100% gratuitos
            </span>
            <span>
              <span className="dot" /> Modalidad presencial
            </span>
          </div>
          <span>Azul, Buenos Aires</span>
        </div>
      </div>

      <header className="site-header">
        <nav className="wrap site-nav">
          <Link href="/" className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cfl401azul_logo.jpg"
              alt="CFL 401 Azul"
              width={46}
              height={46}
            />
            <span className="logo-text">
              <span className="name">Centro de Formación Laboral 401</span>
              <br />
              <span className="sub">Azul</span>
            </span>
          </Link>
          <div className="navlinks">
            {NAV_ITEMS.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.key}
                  href={item.href}
                  className={active === item.key ? "active" : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.key}
                  href={item.href}
                  className={active === item.key ? "active" : undefined}
                >
                  {item.label}
                </a>
              )
            )}
          </div>
          <div className="nav-actions">
            <Link href="/panel/login" className="btn-login">
              Iniciar sesión
            </Link>
            <a href="#" className="nav-cta">
              Inscribirme
            </a>
          </div>
        </nav>
      </header>
    </>
  );
}