// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SeccionPanel } from "@/lib/auth/autorizacion";
import CampanaNotificaciones from "@/components/panel/CampanaNotificaciones";
import { IconoSeccion } from "@/components/panel/IconoSeccion";

type UsuarioSesion = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  debeCambiarContrasena: boolean;
  rol: { nombre: string; nivel: number };
};

const DEFINICION_GRUPOS: {
  titulo: string;
  claves: SeccionPanel["clave"][];
}[] = [
  {
    titulo: "General",
    claves: ["inicio", "notificaciones"],
  },
  {
    titulo: "Gestión Académica",
    claves: ["cursos", "categorias-cursos", "usuarios"],
  },
  {
    titulo: "Contenido Web",
    claves: ["noticias", "guia", "sobre", "faqs", "imagenes"],
  },
  {
    titulo: "Administración",
    claves: ["consultas", "contacto", "configuracion", "auditoria"],
  },
];

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
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const bloqueado = user.debeCambiarContrasena;

  // Con contraseña temporal no se puede operar el panel: se manda al cambio
  // obligatorio y el shell no renderiza nada del contenido.
  useEffect(() => {
    if (bloqueado) {
      router.replace("/panel/cambiar-mi-contrasena");
    }
  }, [bloqueado, router]);

  // Cierra el sidebar al navegar
  useEffect(() => {
    setSidebarAbierto(false);
  }, [pathname]);

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

  // Agrupamiento de secciones autorizadas
  const grupos = useMemo(() => {
    const mapaSecciones = new Map(secciones.map((s) => [s.clave, s]));
    const clavesAsignadas = new Set<string>();

    const lista = DEFINICION_GRUPOS.map((def) => {
      const items: SeccionPanel[] = [];
      for (const clave of def.claves) {
        const sec = mapaSecciones.get(clave);
        if (sec) {
          items.push(sec);
          clavesAsignadas.add(clave);
        }
      }
      return { titulo: def.titulo, items };
    }).filter((g) => g.items.length > 0);

    // Fallback: si aparece una sección nueva no clasificada
    const sobrantes = secciones.filter((s) => !clavesAsignadas.has(s.clave));
    if (sobrantes.length > 0) {
      lista.push({ titulo: "Otras secciones", items: sobrantes });
    }

    return lista;
  }, [secciones]);

  // Sección actual según URL para el título superior
  const seccionActual = useMemo(() => {
    if (pathname === "/panel") {
      return secciones.find((s) => s.clave === "inicio");
    }
    return (
      secciones.find(
        (s) => s.clave !== "inicio" && s.href && pathname.startsWith(s.href)
      ) ?? null
    );
  }, [pathname, secciones]);

  if (bloqueado) {
    return (
      <div className="panel">
        <main className="wrap panel-main">
          <p className="form-error">
            Tu contraseña es temporal. Necesás cambiarla antes de seguir.
          </p>
          <Link href="/panel/cambiar-mi-contrasena" className="btn-primary btn-sm">
            Cambiar mi contraseña
          </Link>
        </main>
      </div>
    );
  }

  const iniciales = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();

  return (
    <div className="panel-layout">
      {/* Telón de fondo oscuro para cerrar en móvil */}
      {sidebarAbierto && (
        <div
          className="panel-sidebar-backdrop"
          onClick={() => setSidebarAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* ── BARRA LATERAL (SIDEBAR) ────────────────────────── */}
      <aside
        className={`panel-sidebar${sidebarAbierto ? " abierto" : ""}`}
        aria-label="Navegación principal del panel"
      >
        <div className="panel-sidebar-header">
          <Link
            href="/panel"
            className="panel-sidebar-brand"
            onClick={() => setSidebarAbierto(false)}
          >
            <span className="panel-brand-dot"></span>
            <div className="panel-brand-text">
              <span className="panel-brand-name">CFL 401</span>
              <span className="panel-brand-sub">Panel Administrativo</span>
            </div>
          </Link>
          <button
            type="button"
            className="panel-sidebar-close"
            aria-label="Cerrar menú lateral"
            onClick={() => setSidebarAbierto(false)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="panel-sidebar-nav">
          {grupos.map((grupo) => (
            <div key={grupo.titulo} className="panel-sidebar-group">
              <div className="panel-sidebar-group-title">{grupo.titulo}</div>
              <div className="panel-sidebar-group-items">
                {grupo.items.map((seccion) => {
                  const activa =
                    seccion.clave === "inicio"
                      ? pathname === "/panel"
                      : seccion.href
                        ? pathname.startsWith(seccion.href)
                        : false;

                  const clase = `panel-sidebar-item${activa ? " active" : ""}`;

                  return seccion.href ? (
                    <Link
                      key={seccion.clave}
                      href={seccion.href}
                      className={clase}
                      onClick={() => setSidebarAbierto(false)}
                    >
                      <span className="panel-sidebar-icon">
                        <IconoSeccion clave={seccion.clave} size={18} />
                      </span>
                      <span className="panel-sidebar-title">{seccion.titulo}</span>
                    </Link>
                  ) : (
                    <span key={seccion.clave} className={clase}>
                      <span className="panel-sidebar-icon">
                        <IconoSeccion clave={seccion.clave} size={18} />
                      </span>
                      <span className="panel-sidebar-title">{seccion.titulo}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Perfil del usuario abajo en el sidebar */}
        <div className="panel-sidebar-footer">
          <div className="panel-user-profile">
            <div className="panel-user-avatar" aria-hidden="true">
              {iniciales}
            </div>
            <div className="panel-user-meta">
              <strong className="panel-user-name">
                {user.nombre} {user.apellido}
              </strong>
              <span className="panel-user-role">{user.rol.nombre}</span>
            </div>
          </div>
          <div className="panel-user-actions">
            <Link
              href="/panel/mis-datos"
              className="panel-user-action-btn"
              title="Mis datos de cuenta"
              onClick={() => setSidebarAbierto(false)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Mis datos</span>
            </Link>
            <button
              type="button"
              className="panel-user-action-btn panel-user-logout"
              onClick={cerrarSesion}
              disabled={cerrando}
              title="Cerrar sesión"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>{cerrando ? "Saliendo…" : "Salir"}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL CON TOPBAR ─────────────────────── */}
      <div className="panel-content-area">
        <header className="panel-topbar">
          <div className="panel-topbar-left">
            <button
              type="button"
              className="panel-burger-btn"
              aria-label={sidebarAbierto ? "Cerrar menú lateral" : "Abrir menú lateral"}
              onClick={() => setSidebarAbierto((abierto) => !abierto)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="panel-topbar-breadcrumb">
              <span className="panel-topbar-context">Panel</span>
              {seccionActual && seccionActual.clave !== "inicio" && (
                <>
                  <span className="panel-topbar-separator">/</span>
                  <span className="panel-topbar-current">
                    {seccionActual.titulo}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="panel-topbar-right">
            <CampanaNotificaciones />
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="panel-ver-sitio"
              title="Abrir página pública en una nueva pestaña"
            >
              Ver sitio ↗
            </Link>
          </div>
        </header>

        <main className="panel-main">{children}</main>
      </div>
    </div>
  );
}
