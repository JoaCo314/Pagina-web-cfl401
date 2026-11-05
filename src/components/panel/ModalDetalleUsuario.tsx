// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export type UsuarioDetalleInfo = {
  id: number;
  nombre: string;
  dni: string;
  email: string;
  telefono: string | null;
  rolNombre: string;
  activo: boolean;
  bloqueada: boolean;
  debeCambiarContrasena: boolean;
  esPropio: boolean;
  cursosAsignados: number;
};

export default function ModalDetalleUsuario({
  abierto,
  usuario,
  onCerrar,
}: {
  abierto: boolean;
  usuario: UsuarioDetalleInfo;
  onCerrar: () => void;
}) {
  const montado = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const tituloId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const focoAnteriorRef = useRef<HTMLElement | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!abierto) return;

    focoAnteriorRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        onCerrar();
        return;
      }
      if (evento.key !== "Tab" || !panelRef.current) return;

      const foco = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (foco.length === 0) return;

      const primero = foco[0];
      const ultimo = foco[foco.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const anterior = focoAnteriorRef.current;
      if (anterior && anterior.isConnected) {
        anterior.focus();
      }
    };
  }, [abierto, onCerrar]);

  async function copiarEmail() {
    try {
      await navigator.clipboard.writeText(usuario.email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles, no falla la UI
    }
  }

  if (!abierto || !montado) return null;

  return createPortal(
    <div className="dialogo-fondo" onMouseDown={onCerrar}>
      <div
        className="dialogo modal-detalle-usuario"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        ref={panelRef}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-detalle-header">
          <div className="modal-detalle-avatar" aria-hidden="true">
            <svg
              width="22"
              height="22"
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
          </div>
          <div className="modal-detalle-header-text">
            <h2 id={tituloId} className="modal-detalle-titulo">
              Ficha del usuario
            </h2>
            <p className="modal-detalle-subtitulo">
              {usuario.nombre} · {usuario.rolNombre}
            </p>
          </div>
          <button
            type="button"
            className="modal-detalle-cerrar"
            onClick={onCerrar}
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        <div className="modal-detalle-cuerpo">
          <div className="detalle-dato-item">
            <span className="detalle-dato-label">Nombre completo</span>
            <div className="detalle-dato-valor">
              <strong>{usuario.nombre}</strong>
              {usuario.esPropio && <span className="chip-vos">Tu cuenta</span>}
            </div>
          </div>

          <div className="detalle-dato-item">
            <span className="detalle-dato-label">DNI</span>
            <div className="detalle-dato-valor">{usuario.dni}</div>
          </div>

          <div className="detalle-dato-item">
            <span className="detalle-dato-label">Correo electrónico</span>
            <div className="detalle-dato-valor valor-con-copiar">
              <a
                href={`mailto:${usuario.email}`}
                className="detalle-email-link"
                title={`Enviar correo a ${usuario.email}`}
              >
                {usuario.email}
              </a>
              <button
                type="button"
                className="btn-copiar-email"
                onClick={copiarEmail}
                title="Copiar correo al portapapeles"
                aria-label="Copiar correo al portapapeles"
              >
                {copiado ? (
                  <>
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
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="detalle-dato-item">
            <span className="detalle-dato-label">Teléfono</span>
            <div className="detalle-dato-valor">
              {usuario.telefono ? (
                <a
                  href={`tel:${usuario.telefono.replace(/\s+/g, "")}`}
                  className="detalle-tel-link"
                >
                  {usuario.telefono}
                </a>
              ) : (
                <span className="td-vacio">No registrado</span>
              )}
            </div>
          </div>

          <div className="detalle-dato-item">
            <span className="detalle-dato-label">Rol en la plataforma</span>
            <div className="detalle-dato-valor">
              <span className="chip-modalidad">{usuario.rolNombre}</span>
            </div>
          </div>

          <div className="detalle-dato-item">
            <span className="detalle-dato-label">Estado de la cuenta</span>
            <div className="detalle-dato-valor detalle-estado-bloque">
              {usuario.bloqueada ? (
                <span className="badge-estado bloqueada">Cuenta bloqueada</span>
              ) : (
                <span className={`badge-estado ${usuario.activo ? "ok" : "off"}`}>
                  {usuario.activo ? "Cuenta activa" : "Cuenta inactiva"}
                </span>
              )}
              {usuario.debeCambiarContrasena && (
                <span className="badge-estado pendiente">
                  Contraseña temporal pendiente de cambio
                </span>
              )}
            </div>
          </div>

          <div className="detalle-dato-item">
            <span className="detalle-dato-label">Cursos asignados</span>
            <div className="detalle-dato-valor">
              {usuario.cursosAsignados > 0
                ? `${usuario.cursosAsignados} curso${usuario.cursosAsignados > 1 ? "s" : ""} a cargo`
                : "Sin cursos asignados"}
            </div>
          </div>
        </div>

        <div className="modal-detalle-footer">
          <Link
            href={`/panel/usuarios/${usuario.id}/editar`}
            className="btn-primary btn-sm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Editar datos
          </Link>
          <button
            type="button"
            className="btn-ghost-dark btn-sm"
            onClick={onCerrar}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
