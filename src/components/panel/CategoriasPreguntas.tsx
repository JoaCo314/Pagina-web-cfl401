"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import EliminarPregunta from "@/components/panel/EliminarPregunta";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";
import type { CategoriaPreguntaListable } from "@/lib/preguntasFrecuentes";

export type CategoriaListable = {
  id: number;
  nombre: string;
  orden: number | null;
  activo: boolean;
  _count: { preguntas: number };
};

type AccionCategoria = "renombrar" | "alternar" | "eliminar";

/// Menú ⋮ de acciones secundarias de una categoría (Renombrar, Activar/Desactivar, Eliminar).
/// Se ancla con `position: fixed` para evitar recortes de overflow y no activa el acordeón al hacer clic.
function MenuAccionesCategoria({
  categoria,
  onElegir,
  disabled,
}: {
  categoria: CategoriaPreguntaListable;
  onElegir: (accion: AccionCategoria) => void;
  disabled: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ top: -10000, left: -10000 });
  const menuId = useId();
  const disparadorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const cerrarMenu = useCallback((devolverFoco: boolean) => {
    setAbierto(false);
    if (devolverFoco) disparadorRef.current?.focus();
  }, []);

  const posicionarMenu = useCallback(() => {
    const disparador = disparadorRef.current;
    const menu = menuRef.current;
    if (!disparador || !menu) return false;
    const marco = disparador.getBoundingClientRect();
    if (marco.bottom < 0 || marco.top > window.innerHeight) return false;
    const alto = menu.offsetHeight;
    const ancho = menu.offsetWidth;
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
    setAbierto(true);
  }

  useEffect(() => {
    if (!abierto) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function alPointerDown(evento: PointerEvent) {
      const destino = evento.target as Node | null;
      if (!destino) return;
      if (menuRef.current?.contains(destino)) return;
      if (disparadorRef.current?.contains(destino)) return;
      cerrarMenu(false);
    }
    document.addEventListener("pointerdown", alPointerDown);
    return () => document.removeEventListener("pointerdown", alPointerDown);
  }, [abierto, cerrarMenu]);

  useEffect(() => {
    if (!abierto) return;
    function alMoverVista() {
      if (!posicionarMenu()) cerrarMenu(false);
    }
    window.addEventListener("scroll", alMoverVista, true);
    window.addEventListener("resize", alMoverVista);
    return () => {
      window.removeEventListener("scroll", alMoverVista, true);
      window.removeEventListener("resize", alMoverVista);
    };
  }, [abierto, cerrarMenu, posicionarMenu]);

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

  function ejecutar(tipo: AccionCategoria) {
    disparadorRef.current?.focus();
    setAbierto(false);
    onElegir(tipo);
  }

  return (
    <div className="faq-menu-contenedor" onClick={(e) => e.stopPropagation()}>
      <button
        ref={disparadorRef}
        type="button"
        className="mas-acciones"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={menuId}
        aria-label={`Acciones de categoría ${categoria.nombre}`}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (abierto) {
            cerrarMenu(true);
          } else {
            abrirMenu();
          }
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

      <div
        id={menuId}
        ref={menuRef}
        className="menu-acciones"
        role="menu"
        aria-label={`Acciones de categoría ${categoria.nombre}`}
        aria-orientation="vertical"
        aria-hidden={!abierto}
        style={{
          top: posicion.top,
          left: posicion.left,
          visibility: abierto ? "visible" : "hidden",
          pointerEvents: abierto ? "auto" : "none",
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
          onClick={() => ejecutar("renombrar")}
        >
          Renombrar
        </button>
        <button
          type="button"
          role="menuitem"
          className={categoria.activo ? "menu-item-peligro" : "menu-item-ok"}
          onClick={() => ejecutar("alternar")}
        >
          {categoria.activo ? "Desactivar" : "Activar"}
        </button>
        <button
          type="button"
          role="menuitem"
          className="menu-item-peligro"
          onClick={() => ejecutar("eliminar")}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

/// Panel interactivo de preguntas frecuentes:
/// - Creación compacta de categorías.
/// - Lista de categorías desplegables en acordeón.
/// - Menú de 3 puntos para acciones de categoría.
/// - Tabla estructurada y fija de preguntas con posición numérica real.
export default function CategoriasPreguntas({
  categorias: categoriasIniciales,
}: {
  categorias: CategoriaPreguntaListable[];
}) {
  const router = useRouter();
  const [categorias, setCategorias] = useState(categoriasIniciales);
  const [nueva, setNueva] = useState("");
  const [mostrarCrearCategoria, setMostrarCrearCategoria] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [reordenando, setReordenando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<CategoriaPreguntaListable | null>(null);
  const [arrastrandoPregunta, setArrastrandoPregunta] = useState<{
    categoriaId: number;
    indice: number;
  } | null>(null);
  const [sobrePregunta, setSobrePregunta] = useState<{
    categoriaId: number;
    indice: number;
  } | null>(null);
  const inputNuevaCategoriaRef = useRef<HTMLInputElement>(null);

  const [prevIniciales, setPrevIniciales] = useState(categoriasIniciales);
  if (prevIniciales !== categoriasIniciales) {
    setPrevIniciales(categoriasIniciales);
    setCategorias(categoriasIniciales);
  }

  useEffect(() => {
    if (mostrarCrearCategoria) {
      inputNuevaCategoriaRef.current?.focus();
    }
  }, [mostrarCrearCategoria]);

  // Inicializar con la primera categoría expandida si existe, o vacía si no hay.
  const [abiertas, setAbiertas] = useState<Set<number>>(() => {
    return categorias.length > 0 ? new Set([categorias[0].id]) : new Set();
  });

  function toggleCategoria(id: number) {
    setAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function crear() {
    const nombre = nueva.trim();
    if (!nombre) return;
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch("/api/categorias-preguntas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo crear la categoría.");
        return;
      }
      setNueva("");
      setMostrarCrearCategoria(false);
      router.refresh();
    } catch {
      setError("No se pudo crear la categoría.");
    } finally {
      setOcupado(false);
    }
  }

  async function guardar(id: number) {
    const nombre = editandoNombre.trim();
    if (!nombre) return;
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch(`/api/categorias-preguntas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo guardar la categoría.");
        return;
      }
      setEditandoId(null);
      router.refresh();
    } catch {
      setError("No se pudo guardar la categoría.");
    } finally {
      setOcupado(false);
    }
  }

  async function alternarActiva(categoria: CategoriaPreguntaListable) {
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch(`/api/categorias-preguntas/${categoria.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: categoria.nombre,
          activo: !categoria.activo,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo actualizar la categoría.");
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo actualizar la categoría.");
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar(categoria: CategoriaPreguntaListable) {
    setOcupado(true);
    setError(null);
    try {
      const res = await fetchConTimeout(`/api/categorias-preguntas/${categoria.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "No se pudo eliminar la categoría.");
        return;
      }
      setPorEliminar(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo eliminar la categoría. Revisá tu conexión e intentá nuevamente."
      );
    } finally {
      setOcupado(false);
    }
  }

  async function guardarReordenamiento(
    categoriaId: number,
    nuevasPreguntas: CategoriaPreguntaListable["preguntas"]
  ) {
    const ordenIds = nuevasPreguntas.map((p) => p.id);
    setReordenando(true);
    try {
      const res = await fetch("/api/preguntas-frecuentes/reordenar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoriaId, ordenIds }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "No se pudo guardar el nuevo orden.");
        router.refresh();
      }
    } catch {
      setError("No se pudo conectar con el servidor para guardar el orden.");
      router.refresh();
    } finally {
      setReordenando(false);
    }
  }

  function moverPregunta(categoriaId: number, indiceOrigen: number, direccion: "arriba" | "abajo") {
    const indiceDestino = direccion === "arriba" ? indiceOrigen - 1 : indiceOrigen + 1;
    setCategorias((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoriaId) return cat;
        if (indiceDestino < 0 || indiceDestino >= cat.preguntas.length) return cat;

        const copia = [...cat.preguntas];
        const [movido] = copia.splice(indiceOrigen, 1);
        copia.splice(indiceDestino, 0, movido);

        const actualizadas = copia.map((p, idx) => ({ ...p, orden: idx + 1 }));
        guardarReordenamiento(categoriaId, actualizadas);
        return { ...cat, preguntas: actualizadas };
      })
    );
  }

  function reordenarPorDrag(categoriaId: number, indiceOrigen: number, indiceDestino: number) {
    if (indiceOrigen === indiceDestino) return;
    setCategorias((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoriaId) return cat;
        if (
          indiceOrigen < 0 ||
          indiceOrigen >= cat.preguntas.length ||
          indiceDestino < 0 ||
          indiceDestino >= cat.preguntas.length
        ) {
          return cat;
        }

        const copia = [...cat.preguntas];
        const [movido] = copia.splice(indiceOrigen, 1);
        copia.splice(indiceDestino, 0, movido);

        const actualizadas = copia.map((p, idx) => ({ ...p, orden: idx + 1 }));
        guardarReordenamiento(categoriaId, actualizadas);
        return { ...cat, preguntas: actualizadas };
      })
    );
  }

  function onAccionCategoria(accion: AccionCategoria, categoria: CategoriaPreguntaListable) {
    if (accion === "renombrar") {
      setEditandoId(categoria.id);
      setEditandoNombre(categoria.nombre);
    } else if (accion === "alternar") {
      alternarActiva(categoria);
    } else if (accion === "eliminar") {
      setPorEliminar(categoria);
    }
  }

  return (
    <div className="faqs-admin-root">
      {/* Encabezado unificado de la sección con acciones principales */}
      <div className="panel-head">
        <div>
          <h1 className="panel-title">Preguntas frecuentes</h1>
          <p className="panel-lead">
            Administrá las categorías y las preguntas de la página pública. Las
            preguntas inactivas o las categorías sin preguntas activas no se
            muestran en el sitio.
          </p>
        </div>
        <div className="faqs-acciones-principales">
          <button
            type="button"
            className="btn-ghost-dark btn-sm"
            onClick={() => {
              setMostrarCrearCategoria((prev) => !prev);
              setError(null);
            }}
            aria-expanded={mostrarCrearCategoria}
          >
            {mostrarCrearCategoria ? "Cerrar" : "+ Nueva categoría"}
          </button>
          <Link
            href="/panel/preguntas-frecuentes/nueva"
            className="btn-primary btn-sm"
          >
            + Nueva pregunta
          </Link>
        </div>
      </div>

      {/* Formulario colapsable para crear categoría */}
      {mostrarCrearCategoria && (
        <div className="panel-box faqs-crear-box animate-fade-in">
          <div className="faqs-crear-head">
            <h2>Crear nueva categoría</h2>
            <p>
              Agrupá tus preguntas en temas. Las categorías se crean por defecto en estado activo.
            </p>
          </div>
          <div className="faqs-crear-fila">
            <input
              ref={inputNuevaCategoriaRef}
              type="text"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              placeholder="Nombre de la nueva categoría (ej. Inscripción, Cursada, Requisitos)"
              aria-label="Nombre de la nueva categoría"
              disabled={ocupado}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  crear();
                } else if (e.key === "Escape") {
                  setMostrarCrearCategoria(false);
                }
              }}
            />
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={crear}
              disabled={ocupado || !nueva.trim()}
            >
              Crear categoría
            </button>
            <button
              type="button"
              className="btn-ghost-dark btn-sm"
              onClick={() => {
                setMostrarCrearCategoria(false);
                setNueva("");
                setError(null);
              }}
              disabled={ocupado}
            >
              Cancelar
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
      )}

      {/* Lista de categorías desplegables tipo acordeón */}
      {categorias.length === 0 ? (
        <p className="panel-vacio">
          Todavía no hay categorías creadas. Creá la primera categoría arriba
          para empezar a cargar preguntas frecuentes.
        </p>
      ) : (
        <div className="faqs-acordeon-lista">
          {categorias.map((categoria) => {
            const abierta = abiertas.has(categoria.id);
            const totalPreguntas = categoria.preguntas.length;
            const esEditando = editandoId === categoria.id;

            return (
              <div
                key={categoria.id}
                className={`panel-box faqs-acordeon-item ${
                  !categoria.activo ? "categoria-inactiva" : ""
                } ${abierta ? "item-abierto" : ""}`}
              >
                {/* Cabecera del acordeón */}
                <div className="faqs-acordeon-head">
                  {esEditando ? (
                    <div
                      className="faqs-acordeon-renombrar"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editandoNombre}
                        onChange={(e) => setEditandoNombre(e.target.value)}
                        aria-label={`Nombre de ${categoria.nombre}`}
                        autoFocus
                        disabled={ocupado}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            guardar(categoria.id);
                          }
                          if (e.key === "Escape") setEditandoId(null);
                        }}
                      />
                      <div className="faqs-renombrar-acciones">
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={() => guardar(categoria.id)}
                          disabled={ocupado || !editandoNombre.trim()}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="btn-ghost-dark btn-sm"
                          onClick={() => setEditandoId(null)}
                          disabled={ocupado}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="faqs-acordeon-trigger"
                        onClick={() => toggleCategoria(categoria.id)}
                        aria-expanded={abierta}
                        aria-controls={`faq-categoria-contenido-${categoria.id}`}
                      >
                        <svg
                          className={`faqs-acordeon-chevron ${
                            abierta ? "rotado" : ""
                          }`}
                          viewBox="0 0 20 20"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="6 8 10 12 14 8" />
                        </svg>

                        <div className="faqs-acordeon-info">
                          <h3 className="faqs-acordeon-titulo">
                            {categoria.nombre}
                          </h3>
                          <span className="faqs-acordeon-contador">
                            {totalPreguntas}{" "}
                            {totalPreguntas === 1 ? "pregunta" : "preguntas"}
                          </span>
                        </div>

                        <span
                          className={`badge-estado ${
                            categoria.activo ? "ok" : "off"
                          }`}
                        >
                          {categoria.activo ? "Activa" : "Inactiva"}
                        </span>
                      </button>

                      <div className="faqs-categoria-cabecera-acciones">
                        <Link
                          href={`/panel/preguntas-frecuentes/nueva?categoriaId=${categoria.id}`}
                          className="faq-btn-agregar-pregunta"
                          title={`Agregar pregunta a ${categoria.nombre}`}
                          aria-label={`Agregar pregunta a la categoría ${categoria.nombre}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            viewBox="0 0 20 20"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <line x1="10" y1="4" x2="10" y2="16" />
                            <line x1="4" y1="10" x2="16" y2="10" />
                          </svg>
                          <span className="faq-btn-agregar-texto">Pregunta</span>
                        </Link>

                        <MenuAccionesCategoria
                          categoria={categoria}
                          disabled={ocupado}
                          onElegir={(accion) =>
                            onAccionCategoria(accion, categoria)
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Contenido desplegable: listado de preguntas */}
                {abierta && (
                  <div
                    id={`faq-categoria-contenido-${categoria.id}`}
                    className="faqs-acordeon-body"
                    role="region"
                    aria-label={`Preguntas de ${categoria.nombre}`}
                  >
                    {!categoria.activo && (
                      <div className="faq-aviso-inactiva">
                        <svg
                          viewBox="0 0 20 20"
                          width="16"
                          height="16"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Esta categoría está inactiva: ninguna de sus preguntas
                          se muestra en el sitio público hasta que sea reactivada.
                        </span>
                      </div>
                    )}

                    {totalPreguntas === 0 ? (
                      <div className="faq-categoria-vacia">
                        <p>No hay preguntas en esta categoría todavía.</p>
                        <Link
                          href={`/panel/preguntas-frecuentes/nueva?categoriaId=${categoria.id}`}
                          className="btn-ghost-dark btn-sm"
                        >
                          + Agregar pregunta
                        </Link>
                      </div>
                    ) : (
                      <div className="panel-table-wrap">
                        <table className="panel-table panel-table-faqs">
                          <colgroup>
                            <col className="col-faq-drag" />
                            <col className="col-faq-pregunta" />
                            <col className="col-faq-orden" />
                            <col className="col-faq-estado" />
                            <col className="col-faq-acciones" />
                          </colgroup>
                          <thead>
                            <tr>
                              <th scope="col" aria-label="Mover" className="th-center" />
                              <th scope="col">Pregunta</th>
                              <th scope="col" className="th-center">
                                Orden
                              </th>
                              <th scope="col" className="th-center">
                                Estado
                              </th>
                              <th scope="col" className="th-right">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoria.preguntas.map((pregunta, idx) => {
                              // Mostrar la posición numérica real: si tiene orden definido se muestra,
                              // y si es null se muestra su posición ordenada en la lista (sin guiones).
                              const posicionOrden =
                                pregunta.orden !== null &&
                                pregunta.orden !== undefined
                                  ? pregunta.orden
                                  : idx + 1;

                              const esPrimero = idx === 0;
                              const esUltimo = idx === categoria.preguntas.length - 1;
                              const esArrastrado =
                                arrastrandoPregunta?.categoriaId === categoria.id &&
                                arrastrandoPregunta?.indice === idx;
                              const esSobre =
                                sobrePregunta?.categoriaId === categoria.id &&
                                sobrePregunta?.indice === idx;

                              return (
                                <tr
                                  key={pregunta.id}
                                  draggable
                                  onDragStart={() => {
                                    setArrastrandoPregunta({
                                      categoriaId: categoria.id,
                                      indice: idx,
                                    });
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    if (
                                      arrastrandoPregunta &&
                                      arrastrandoPregunta.categoriaId === categoria.id &&
                                      arrastrandoPregunta.indice !== idx
                                    ) {
                                      setSobrePregunta({
                                        categoriaId: categoria.id,
                                        indice: idx,
                                      });
                                    }
                                  }}
                                  onDragLeave={() => {
                                    if (
                                      sobrePregunta?.categoriaId === categoria.id &&
                                      sobrePregunta?.indice === idx
                                    ) {
                                      setSobrePregunta(null);
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    if (
                                      arrastrandoPregunta &&
                                      arrastrandoPregunta.categoriaId === categoria.id
                                    ) {
                                      reordenarPorDrag(
                                        categoria.id,
                                        arrastrandoPregunta.indice,
                                        idx
                                      );
                                    }
                                    setArrastrandoPregunta(null);
                                    setSobrePregunta(null);
                                  }}
                                  onDragEnd={() => {
                                    setArrastrandoPregunta(null);
                                    setSobrePregunta(null);
                                  }}
                                  className={`faq-fila-arrastrable ${
                                    esArrastrado ? "faq-fila-arrastrando" : ""
                                  } ${esSobre ? "faq-fila-sobre" : ""}`}
                                >
                                  <td className="td-faq-drag" data-label="Arrastrar">
                                    <span
                                      className="faq-drag-handle"
                                      title="Arrastrar para reordenar"
                                      aria-hidden="true"
                                    >
                                      <svg
                                        viewBox="0 0 20 20"
                                        width="16"
                                        height="16"
                                        fill="currentColor"
                                      >
                                        <circle cx="7" cy="5" r="1.5" />
                                        <circle cx="13" cy="5" r="1.5" />
                                        <circle cx="7" cy="10" r="1.5" />
                                        <circle cx="13" cy="10" r="1.5" />
                                        <circle cx="7" cy="15" r="1.5" />
                                        <circle cx="13" cy="15" r="1.5" />
                                      </svg>
                                    </span>
                                  </td>
                                  <td
                                    data-label="Pregunta"
                                    className="td-faq-pregunta"
                                  >
                                    <strong className="faq-texto-pregunta">
                                      {pregunta.pregunta}
                                    </strong>
                                  </td>
                                  <td
                                    data-label="Orden"
                                    className="td-faq-orden td-center"
                                  >
                                    <div className="faq-control-orden">
                                      <span
                                        className="badge-orden"
                                        title={`Posición ${posicionOrden}`}
                                      >
                                        {posicionOrden}
                                      </span>
                                      <div className="faq-flechas-orden">
                                        <button
                                          type="button"
                                          className="faq-btn-orden"
                                          disabled={esPrimero || reordenando}
                                          onClick={() =>
                                            moverPregunta(categoria.id, idx, "arriba")
                                          }
                                          title="Mover arriba"
                                          aria-label={`Mover "${pregunta.pregunta}" arriba`}
                                        >
                                          <svg
                                            viewBox="0 0 20 20"
                                            width="12"
                                            height="12"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <polyline points="4 13 10 7 16 13" />
                                          </svg>
                                        </button>
                                        <button
                                          type="button"
                                          className="faq-btn-orden"
                                          disabled={esUltimo || reordenando}
                                          onClick={() =>
                                            moverPregunta(categoria.id, idx, "abajo")
                                          }
                                          title="Mover abajo"
                                          aria-label={`Mover "${pregunta.pregunta}" abajo`}
                                        >
                                          <svg
                                            viewBox="0 0 20 20"
                                            width="12"
                                            height="12"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <polyline points="4 7 10 13 16 7" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td
                                    data-label="Estado"
                                    className="td-faq-estado td-center"
                                  >
                                    <span
                                      className={`badge-estado ${
                                        pregunta.activo ? "ok" : "off"
                                      }`}
                                    >
                                      {pregunta.activo ? "Visible" : "Inactiva"}
                                    </span>
                                  </td>
                                  <td
                                    data-label="Acciones"
                                    className="td-faq-acciones td-right"
                                  >
                                    <div className="acciones-curso acciones-faq">
                                      <Link
                                        href={`/panel/preguntas-frecuentes/${pregunta.id}/editar`}
                                        className="link-accion"
                                      >
                                        Editar
                                      </Link>
                                      <EliminarPregunta
                                        preguntaId={pregunta.id}
                                        texto={pregunta.pregunta}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Diálogo accesible de confirmación para eliminar categoría */}
      {porEliminar && (
        <ConfirmDialog
          abierto
          titulo="Eliminar la categoría"
          destructivo
          ocupado={ocupado}
          confirmar="Eliminar"
          mensaje={`Se va a eliminar la categoría "${porEliminar.nombre}"${
            porEliminar.preguntas.length > 0
              ? ` y sus ${porEliminar.preguntas.length} pregunta${
                  porEliminar.preguntas.length === 1 ? "" : "s"
                }`
              : ""
          }. Esta acción no se puede deshacer.`}
          onCancelar={() => setPorEliminar(null)}
          onConfirmar={() => eliminar(porEliminar)}
        />
      )}
    </div>
  );
}
