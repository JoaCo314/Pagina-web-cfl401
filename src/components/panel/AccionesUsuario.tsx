// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import BlanquearContrasena from "@/components/panel/BlanquearContrasena";
import EliminarUsuario from "@/components/panel/EliminarUsuario";
import ToggleUsuario from "@/components/panel/ToggleUsuario";

type Accion = "blanquear" | "alternar" | "eliminar";

/// Acciones de una fila del listado de usuarios. «Editar» es un botón azul
/// visible; las operaciones sensibles (blanquear, desactivar/activar y
/// eliminar) viven en un menú ⋮ para que la celda no quede apilada. Cada
/// operación conserva su propio ConfirmDialog con su confirmación y su aviso
/// de error: el menú solo elige cuál se abre.
///
/// El menú se monta siempre y se oculta con `visibility: hidden` para poder
/// medirlo en el momento de abrirlo y calcular su posición exacta. Va con
/// `position: fixed` anclado al disparador porque `.panel-table-wrap` tiene
/// `overflow-x: auto` y, en escritorio, un menú posicionado dentro de la celda
/// se cortaría en las filas del fondo.
export default function AccionesUsuario({
  usuarioId,
  nombre,
  activo,
  bloqueada,
  esPropio,
  cursosAsignados,
  puedeEliminar,
}: {
  usuarioId: number;
  nombre: string;
  activo: boolean;
  bloqueada: boolean;
  esPropio: boolean;
  cursosAsignados: number;
  puedeEliminar: boolean;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: -10000, left: -10000 });
  const [accion, setAccion] = useState<Accion | null>(null);
  const menuId = useId();
  const disparadorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const cerrarMenu = useCallback((devolverFoco: boolean) => {
    setMenuAbierto(false);
    if (devolverFoco) disparadorRef.current?.focus();
  }, []);

  const cerrarAccion = useCallback(() => {
    setAccion(null);
  }, []);

  // Mide el disparador y recoloca el menú. Devuelve false si el ancla quedó
  // fuera del viewport (no hay dónde anclarlo y conviene cerrar).
  const posicionarMenu = useCallback(() => {
    const disparador = disparadorRef.current;
    const menu = menuRef.current;
    if (!disparador || !menu) return false;
    const marco = disparador.getBoundingClientRect();
    if (marco.bottom < 0 || marco.top > window.innerHeight) return false;
    const alto = menu.offsetHeight;
    const ancho = menu.offsetWidth;
    // Se ancla por abajo y, si no entra en el viewport, se abre hacia arriba;
    // el left alinea el borde derecho del menú con el del disparador.
    let top = marco.bottom + 6;
    if (top + alto > window.innerHeight - 8) {
      top = Math.max(8, marco.top - 6 - alto);
    }
    let left = marco.right - ancho;
    if (left < 8) left = 8;
    setPosicion({ top, left });
    return true;
  }, []);

  function abrirMenu() {
    if (!posicionarMenu()) return;
    setMenuAbierto(true);
  }

  // Al abrir, el foco pasa al primer item (como en los menús nativos) para
  // que quien navega con teclado no tenga que adivinar dónde está.
  useEffect(() => {
    if (!menuAbierto) return;
    menuRef.current
      ?.querySelector<HTMLElement>('[role="menuitem"]')
      ?.focus();
  }, [menuAbierto]);

  // Cierre por clic afuera. El clic sobre el propio disparador lo maneja su
  // onClick (que alterna) y los clics dentro del menú cierran al elegir.
  useEffect(() => {
    if (!menuAbierto) return;
    function alPointerDown(evento: PointerEvent) {
      const destino = evento.target as Node | null;
      if (!destino) return;
      if (menuRef.current?.contains(destino)) return;
      if (disparadorRef.current?.contains(destino)) return;
      cerrarMenu(false);
    }
    document.addEventListener("pointerdown", alPointerDown);
    return () => document.removeEventListener("pointerdown", alPointerDown);
  }, [menuAbierto, cerrarMenu]);

  // El menú está anclado con position: fixed: si la página se mueve (scroll,
  // resize) se recalcula la posición para que siga al disparador en vez de
  // quedar tapando contenido; si el ancla se va del viewport, se cierra. El
  // tercer argumento en true hace que el listener capture y también agarre el
  // scroll horizontal del .panel-table-wrap. Repositionar en lugar de cerrar
  // evita además el caso de un scroll en cola que llega justo después de
  // abrir (p. ej. el scroll automático al hacer clic en un ⋮ lejano).
  useEffect(() => {
    if (!menuAbierto) return;
    function alMoverVista() {
      if (!posicionarMenu()) cerrarMenu(false);
    }
    window.addEventListener("scroll", alMoverVista, true);
    window.addEventListener("resize", alMoverVista);
    return () => {
      window.removeEventListener("scroll", alMoverVista, true);
      window.removeEventListener("resize", alMoverVista);
    };
  }, [menuAbierto, cerrarMenu, posicionarMenu]);

  // Teclado del menú: Escape devuelve el foco al disparador y las flechas
  // recorren los items. Tab no se atrapa: al salir, onBlur cierra el menú sin
  // robarle el foco al elemento donde sigue el usuario.
  function alTeclar(evento: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    if (items.length === 0) return;
    const indice = items.indexOf(document.activeElement as HTMLElement);
    switch (evento.key) {
      case "Escape":
        evento.preventDefault();
        cerrarMenu(true);
        break;
      case "ArrowDown":
        evento.preventDefault();
        items[(indice + 1 + items.length) % items.length].focus();
        break;
      case "ArrowUp":
        evento.preventDefault();
        items[(indice - 1 + items.length) % items.length].focus();
        break;
      case "Home":
        evento.preventDefault();
        items[0].focus();
        break;
      case "End":
        evento.preventDefault();
        items[items.length - 1].focus();
        break;
      default:
        break;
    }
  }

  function elegir(tipo: Accion) {
    // El foco vuelve al disparador ANTES de cerrar: el ConfirmDialog se monta
    // en el mismo commit, captura el elemento activo y se lo devuelve cuando
    // la operación termina.
    disparadorRef.current?.focus();
    setMenuAbierto(false);
    setAccion(tipo);
  }

  // En la propia fila no hay menú: solo queda «Editar». Las operaciones sobre
  // la propia cuenta (blanqueo, baja, eliminación) no se ofrecen desde acá.
  return (
    <span className="acciones-usuario">
      <Link
        href={`/panel/usuarios/${usuarioId}/editar`}
        className="btn-primary btn-sm"
      >
        Editar
      </Link>
      {!esPropio && (
        <button
          ref={disparadorRef}
          type="button"
          className="mas-acciones"
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          aria-controls={menuId}
          aria-label={`Más acciones de ${nombre}`}
          onClick={() => {
            if (menuAbierto) {
              cerrarMenu(true);
              return;
            }
            abrirMenu();
          }}
        >
          <svg
            viewBox="0 0 20 20"
            width="18"
            height="18"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="10" cy="4.2" r="1.8" fill="currentColor" />
            <circle cx="10" cy="10" r="1.8" fill="currentColor" />
            <circle cx="10" cy="15.8" r="1.8" fill="currentColor" />
          </svg>
        </button>
      )}
      {!esPropio && (
        <div
          id={menuId}
          ref={menuRef}
          className="menu-acciones"
          role="menu"
          aria-label={`Acciones de ${nombre}`}
          aria-orientation="vertical"
          aria-hidden={!menuAbierto}
          style={{
            top: posicion.top,
            left: posicion.left,
            visibility: menuAbierto ? "visible" : "hidden",
            pointerEvents: menuAbierto ? "auto" : "none",
          }}
          onBlur={(evento) => {
            const destino = evento.relatedTarget as Node | null;
            if (destino && evento.currentTarget.contains(destino)) return;
            cerrarMenu(false);
          }}
          onKeyDown={alTeclar}
        >
          <button
            type="button"
            role="menuitem"
            className="menu-item-atencion"
            onClick={() => elegir("blanquear")}
          >
            Blanquear contraseña
          </button>
          <button
            type="button"
            role="menuitem"
            className={activo ? "menu-item-peligro" : "menu-item-ok"}
            onClick={() => elegir("alternar")}
          >
            {activo ? "Desactivar" : "Activar"}
          </button>
          {!activo && puedeEliminar && (
            <button
              type="button"
              role="menuitem"
              className="menu-item-peligro"
              onClick={() => elegir("eliminar")}
            >
              Eliminar
            </button>
          )}
        </div>
      )}
      {!esPropio && (
        <BlanquearContrasena
          usuarioId={usuarioId}
          nombre={nombre}
          abierto={accion === "blanquear"}
          onCerrar={cerrarAccion}
        />
      )}
      {!esPropio && (
        <ToggleUsuario
          usuarioId={usuarioId}
          nombre={nombre}
          activo={activo}
          bloqueada={bloqueada}
          cursosAsignados={cursosAsignados}
          abierto={accion === "alternar"}
          onCerrar={cerrarAccion}
        />
      )}
      {!esPropio && !activo && puedeEliminar && (
        <EliminarUsuario
          usuarioId={usuarioId}
          nombre={nombre}
          cursosAsignados={cursosAsignados}
          abierto={accion === "eliminar"}
          onCerrar={cerrarAccion}
        />
      )}
    </span>
  );
}
