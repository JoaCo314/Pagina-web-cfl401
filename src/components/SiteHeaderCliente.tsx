"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SiteHeaderClienteProps = {
  active?: string;
  sesionIniciada: boolean;
  logoUrl?: string;
  logoAlt?: string;
  telefono?: string | null;
};

const NAV_ITEMS = [
  { label: "Cursos", href: "/cursos", key: "cursos" },
  { label: "Sobre el centro", href: "/sobre-el-centro", key: "sobre" },
  { label: "Noticias", href: "/noticias", key: "noticias" },
  { label: "Preguntas frecuentes", href: "/preguntas-frecuentes", key: "faq" },
  { label: "Contacto", href: "/contacto", key: "contacto" },
];

export default function SiteHeaderCliente({
  active,
  sesionIniciada,
  logoUrl = "/cfl401azul_logo.jpg",
  logoAlt = "CFL 401 Azul",
  telefono,
}: SiteHeaderClienteProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [conSombra, setConSombra] = useState(false);

  // El header es sticky: apenas la página se separa del tope se le agrega
  // una sombra para que se note que sigue flotando sobre el contenido.
  useEffect(() => {
    const onScroll = () => setConSombra(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <div className="topbar">
        <div className="wrap">
          <div className="topbar-badges">
            <span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="topbar-icon"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Cursos 100% gratuitos
            </span>
            <span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="topbar-icon"
                aria-hidden="true"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              Modalidad presencial
            </span>
          </div>
          <div className="topbar-right">
            {telefono && (
              <a
                href={`tel:${telefono.replace(/\s+/g, "")}`}
                className="topbar-tel"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="topbar-icon"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{telefono}</span>
              </a>
            )}
            <span className="topbar-loc">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="topbar-icon"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Azul, Buenos Aires
            </span>
          </div>
        </div>
      </div>

      <header className={`site-header${conSombra ? " con-sombra" : ""}`}>
        <nav className="wrap site-nav">
          <Link href="/" className="logo" onClick={cerrarMenu}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={logoAlt} width={46} height={46} />
            <span className="logo-text">
              <span className="name name-full">
                Centro de Formación Laboral 401
              </span>
              <span className="name name-corto">CFL 401</span>
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
            {sesionIniciada ? (
              <Link href="/panel" className="btn-login-solid">
                Panel de control
              </Link>
            ) : (
              <Link href="/panel/login" className="btn-login">
                Iniciar sesión
              </Link>
            )}
            <Link href="/cursos" className="nav-cta">
              <span>Inscribirme</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          <button
            type="button"
            className={`nav-burger${menuAbierto ? " abierto" : ""}`}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <span className="burger-line" />
            <span className="burger-line" />
            <span className="burger-line" />
          </button>
        </nav>

        {menuAbierto && (
          <div className="nav-mobile">
            {NAV_ITEMS.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.key}
                  href={item.href}
                  className={active === item.key ? "active" : undefined}
                  onClick={cerrarMenu}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.key}
                  href={item.href}
                  className={active === item.key ? "active" : undefined}
                  onClick={cerrarMenu}
                >
                  {item.label}
                </a>
              )
            )}
            <div className="nav-mobile-actions">
              {sesionIniciada ? (
                <Link
                  href="/panel"
                  className="btn-login-solid"
                  onClick={cerrarMenu}
                >
                  Panel de control
                </Link>
              ) : (
                <Link
                  href="/panel/login"
                  className="btn-login"
                  onClick={cerrarMenu}
                >
                  Iniciar sesión
                </Link>
              )}
              <Link href="/cursos" className="nav-cta" onClick={cerrarMenu}>
                <span>Inscribirme</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
