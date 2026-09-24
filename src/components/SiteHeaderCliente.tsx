"use client";

import Link from "next/link";
import { useState } from "react";

type SiteHeaderClienteProps = {
  active?: string;
  sesionIniciada: boolean;
};

const NAV_ITEMS = [
  { label: "Cursos", href: "/cursos", key: "cursos" },
  { label: "Sobre el centro", href: "/sobre-el-centro", key: "sobre" },
  { label: "Noticias", href: "/noticias", key: "noticias" },
  { label: "Preguntas frecuentes", href: "/preguntas-frecuentes", key: "faq" },
  { label: "Contacto", href: "#", key: "contacto" },
];

export default function SiteHeaderCliente({
  active,
  sesionIniciada,
}: SiteHeaderClienteProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

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
          <Link href="/" className="logo" onClick={cerrarMenu}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cfl401azul_logo.jpg"
              alt="CFL 401 Azul"
              width={46}
              height={46}
            />
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
              Inscribirme
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
                Inscribirme
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}