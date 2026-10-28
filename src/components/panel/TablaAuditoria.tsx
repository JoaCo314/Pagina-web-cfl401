// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ETIQUETAS_ACCION, ETIQUETAS_RECURSO } from "@/lib/auditoriaDatos";
import {
  etiquetaCampoAuditoria,
  entradasDetalleAuditoria,
  fechaCompleta,
  fechaCompacta,
  formatearCampoAuditoria,
  type NombresCategorias,
  type RegistroAuditoriaUI,
} from "@/lib/auditoriaPresentacion";

/// Obtiene el estilo de badge correspondiente al tipo de acción
function badgeAccionClass(accion: string): string {
  switch (accion) {
    case "crear":
    case "activar":
      return "badge-accion badge-accion-crear";
    case "editar":
    case "asignar_docentes":
      return "badge-accion badge-accion-editar";
    case "eliminar":
    case "desactivar":
      return "badge-accion badge-accion-eliminar";
    case "blanquear_password":
    case "bloquear_cuenta":
      return "badge-accion badge-accion-seguridad";
    default:
      return "badge-accion badge-accion-neutro";
  }
}

/// Listado de acciones de la auditoría con su panel de detalle. La tabla
/// muestra lo esencial (fecha compacta, quién, qué hizo y sobre qué); el
/// detalle no se vuelca en crudo sino en un panel lateral de solo lectura,
/// con los campos etiquetados y formateados. El JSON técnico queda como vista
/// secundaria, detrás de un botón, para depurar sin ensuciar la lectura.
export default function TablaAuditoria({
  registros,
  categorias,
}: {
  registros: RegistroAuditoriaUI[];
  categorias: NombresCategorias;
}) {
  const [abierto, setAbierto] = useState<RegistroAuditoriaUI | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Botón que abrió el panel: al cerrar se le devuelve el foco para que quien
  // navega con teclado no quede perdido en <body>.
  const focoAnteriorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierto) return;

    focoAnteriorRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const desplazamientoPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        setAbierto(null);
        return;
      }
      if (evento.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const foco = Array.from(
        panel.querySelectorAll<HTMLElement>(
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
      document.body.style.overflow = desplazamientoPrevio;
      const anterior = focoAnteriorRef.current;
      if (anterior && anterior.isConnected) anterior.focus();
    };
  }, [abierto]);

  return (
    <>
      <div className="panel-table-wrap">
        <table className="panel-table auditoria-tabla">
          <caption className="sr-only">
            Registro de acciones administrativas con su fecha, autor y detalle
          </caption>
          <colgroup>
            <col className="auditoria-col-fecha" />
            <col className="auditoria-col-usuario" />
            <col className="auditoria-col-accion" />
            <col className="auditoria-col-detalle" />
            <col className="auditoria-col-boton" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Fecha y hora</th>
              <th scope="col">Usuario</th>
              <th scope="col">Acción</th>
              <th scope="col">Detalle</th>
              <th scope="col" className="auditoria-th-boton sr-only">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((registro) => (
              <tr key={registro.id}>
                <td data-label="Fecha y hora">
                  <time dateTime={registro.createdAt}>
                    {fechaCompacta(registro.createdAt)}
                  </time>
                </td>
                <td data-label="Usuario" className="auditoria-celda-usuario">
                  {registro.usuarioNombre ? (
                    <>
                      <strong>{registro.usuarioNombre}</strong>
                      {registro.usuarioEmail && (
                        <span className="td-sub">{registro.usuarioEmail}</span>
                      )}
                      {registro.rol && (
                        <span className="td-sub">Rol: {registro.rol}</span>
                      )}
                    </>
                  ) : (
                    <span className="auditoria-sin-dato">
                      Sesión del sistema
                    </span>
                  )}
                </td>
                <td data-label="Acción">
                  <div className="auditoria-celda-accion">
                    <span className={badgeAccionClass(registro.accion)}>
                      {ETIQUETAS_ACCION[registro.accion] ?? registro.accion}
                    </span>
                    <span className="td-sub">
                      {ETIQUETAS_RECURSO[registro.recurso] ?? registro.recurso}
                    </span>
                  </div>
                </td>
                <td data-label="Detalle">
                  {registro.resumen ? (
                    <p className="auditoria-resumen">{registro.resumen}</p>
                  ) : (
                    <span className="auditoria-sin-dato">—</span>
                  )}
                </td>
                <td data-label="" className="auditoria-celda-boton">
                  <button
                    type="button"
                    className="btn-auditoria-ver"
                    onClick={() => setAbierto(registro)}
                    aria-label={
                      registro.resumen
                        ? `Ver detalles de ${registro.resumen}`
                        : "Ver detalles de la acción"
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>
                      {registro.accion === "editar" ? "Cambios" : "Detalles"}
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {abierto &&
        createPortal(
          <div
            className="detalle-fondo"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setAbierto(null);
            }}
          >
            <div
              className="detalle-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="detalle-auditoria-titulo"
              ref={panelRef}
              tabIndex={-1}
            >
              <header className="detalle-cabecera">
                <h2 id="detalle-auditoria-titulo">Detalle de la acción</h2>
                <button
                  type="button"
                  className="detalle-cerrar"
                  onClick={() => setAbierto(null)}
                  aria-label="Cerrar detalle"
                >
                  ✕
                </button>
              </header>

              <dl className="detalle-meta">
                <dt>Fecha y hora</dt>
                <dd>{fechaCompleta(abierto.createdAt)}</dd>
                <dt>Usuario</dt>
                <dd>{abierto.usuarioNombre ?? "Sesión del sistema"}</dd>
                <dt>Correo</dt>
                <dd>
                  {abierto.usuarioEmail ?? (
                    <span className="auditoria-sin-dato">Sin dato</span>
                  )}
                </dd>
                <dt>Rol al operar</dt>
                <dd>
                  {abierto.rol ?? (
                    <span className="auditoria-sin-dato">Sin dato</span>
                  )}
                </dd>
                <dt>Acción</dt>
                <dd>{ETIQUETAS_ACCION[abierto.accion] ?? abierto.accion}</dd>
                <dt>Sección</dt>
                <dd>{ETIQUETAS_RECURSO[abierto.recurso] ?? abierto.recurso}</dd>
                <dt>Elemento</dt>
                <dd>
                  {abierto.resumen ? (
                    abierto.resumen
                  ) : abierto.recursoId !== null ? (
                    `Id ${abierto.recursoId}`
                  ) : (
                    <span className="auditoria-sin-dato">Sin elemento</span>
                  )}
                </dd>
                <dt>IP</dt>
                <dd>
                  {abierto.ip ?? (
                    <span className="auditoria-sin-dato">Sin dato</span>
                  )}
                </dd>
              </dl>

              <DetalleAcciones
                key={abierto.id}
                registro={abierto}
                categorias={categorias}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/// Cuerpo del panel: los campos del detalle presentados según el tipo de
/// acción. Solo se muestran los datos que la auditoría guardó; nunca se inventan
/// valores anteriores. Detrás de un botón queda el JSON crudo del registro,
/// para depurar; el JSON nunca trae contraseñas ni tokens porque
/// `registrarAuditoria` los descarta al escribir.
function DetalleAcciones({
  registro,
  categorias,
}: {
  registro: RegistroAuditoriaUI;
  categorias: NombresCategorias;
}) {
  const [verTecnicos, setVerTecnicos] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const temporizadorRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (temporizadorRef.current) window.clearTimeout(temporizadorRef.current);
    },
    []
  );

  const entradas = entradasDetalleAuditoria(registro);
  // Toda edición guarda valores nuevos de los campos tocados; la lista
  // `campos` solo aporta el orden y no siempre está presente.
  const esEdicion = registro.accion === "editar" && entradas.length > 0;
  const jsonTecnico = registro.detalle
    ? JSON.stringify(registro.detalle, null, 2)
    : null;

  async function copiarDatos() {
    if (!jsonTecnico) return;
    try {
      await navigator.clipboard.writeText(jsonTecnico);
      setCopiado(true);
      if (temporizadorRef.current) window.clearTimeout(temporizadorRef.current);
      temporizadorRef.current = window.setTimeout(
        () => setCopiado(false),
        2000
      );
    } catch {
      // Sin permiso del portapapeles: el texto queda visible para copiarlo a mano.
    }
  }

  return (
    <>
      {entradas.length === 0 ? (
        <p className="detalle-sin-datos">
          Esta acción no guardó datos adicionales.
        </p>
      ) : (
        <section className="detalle-campos" aria-label="Datos de la acción">
          <h3>
            {esEdicion
              ? "Campos modificados"
              : registro.accion === "crear"
                ? "Datos creados"
                : "Datos adicionales"}
          </h3>
          <dl>
            {entradas.map(([clave, valor]) => (
              <div className="detalle-campo" key={clave}>
                <dt>{etiquetaCampoAuditoria(clave)}</dt>
                <dd>
                  {formatearCampoAuditoria(registro, clave, valor, categorias)}
                </dd>
              </div>
            ))}
          </dl>
          {esEdicion && (
            <p className="detalle-nota">
              La auditoría guarda los valores registrados al momento del cambio
              y no conserva los anteriores: por eso se muestran los datos
              guardados, sin comparación previa.
            </p>
          )}
        </section>
      )}

      {jsonTecnico && (
        <section className="detalle-tecnico" aria-label="Datos técnicos">
          <div className="detalle-tecnico-header">
            <button
              type="button"
              className="btn-toggle-tecnico"
              aria-expanded={verTecnicos}
              onClick={() => setVerTecnicos((v) => !v)}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>{verTecnicos ? "Ocultar datos técnicos" : "Ver datos técnicos"}</span>
            </button>
          </div>
          {verTecnicos && (
            <>
              <div className="detalle-json-wrap">
                <button
                  type="button"
                  className="btn-copiar-json"
                  onClick={copiarDatos}
                  aria-label="Copiar JSON técnico"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
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
                  <span>{copiado ? "Copiado ✓" : "Copiar"}</span>
                </button>
                <pre className="detalle-json">{jsonTecnico}</pre>
              </div>
              <p className="detalle-nota">
                JSON guardado en la auditoría. No incluye contraseñas ni
                tokens: esos datos se descartan al registrar la acción.
              </p>
            </>
          )}
        </section>
      )}
    </>
  );
}
