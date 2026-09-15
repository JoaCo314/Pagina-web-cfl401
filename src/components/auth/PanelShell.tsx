"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [cerrando, setCerrando] = useState(false);

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

      <nav className="panel-nav">
        <div className="wrap panel-nav-inner">
          {secciones.map((seccion) => (
            <span
              key={seccion.clave}
              className={`panel-nav-item${seccion.clave === "inicio" ? " active" : ""}`}
            >
              {seccion.titulo}
            </span>
          ))}
        </div>
      </nav>

      <main className="wrap panel-main">{children}</main>
    </div>
  );
}