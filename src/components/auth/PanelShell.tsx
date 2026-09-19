"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SeccionPanel } from "@/lib/auth/autorizacion";

type UsuarioSesion = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: { nombre: string; nivel: number };
};

export default function PanelShell({
  user,
  secciones,
  children,
}: {
  user: UsuarioSesion;
  secciones: SeccionPanel[];
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [cerrando, setCerrando] = useState(false);
  const [menusAbierto, setMenusAbierto] = useState(false);

  async function cerrarSesion() {
    setCerrando(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // si la red falla igual se limpia la UI y se redirige
    }
    router.replace("/panel/login");
    router.refresh();
  }

  return (
    <div className="panel">
      <header className="panel-header">
        <div className="wrap panel-header-inner">
          <div className="panel-brand">
            <span className="panel-brand-dot"></span>
            CFL 401 · Panel Administrativo
          </div>
          <div className="panel-user">
            <div className="panel-user-info">
              <strong>
                {user.nombre} {user.apellido}
              </strong>
              <span>{user.rol.nombre}</span>
            </div>
            <button
              type="button"
              className="panel-logout"
              onClick={cerrarSesion}
              disabled={cerrando}
            >
              {cerrando ? "Saliendo…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>

      <nav className={`panel-nav${menusAbierto ? " abierto" : ""}`}>
        <div className="wrap panel-nav-inner">
          <button
            type="button"
            className="panel-nav-burger"
            aria-expanded={menusAbierto}
            aria-label={menusAbierto ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenusAbierto((abierto) => !abierto)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <div className="panel-nav-links">
          {secciones.map((seccion) => {
            const activa =
              seccion.clave === "inicio"
                ? pathname === "/panel"
                : seccion.href
                  ? pathname.startsWith(seccion.href)
                  : false;
            const clase = `panel-nav-item${activa ? " active" : ""}`;
            return seccion.href ? (
              <Link
                key={seccion.clave}
                href={seccion.href}
                className={clase}
                onClick={() => setMenusAbierto(false)}
              >
                {seccion.titulo}
              </Link>
            ) : (
              <span key={seccion.clave} className={clase}>
                {seccion.titulo}
              </span>
            );
          })}
        </div>
      </nav>

      <main className="wrap panel-main">{children}</main>
    </div>
  );
}