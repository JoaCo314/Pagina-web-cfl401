"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

export type CategoriaCursoListable = {
  id: number;
  nombre: string;
  orden: number | null;
  activo: boolean;
  cursos: number;
};

/// Gestión inline de categorías de cursos desde el panel: crear, renombrar,
/// activar/desactivar y eliminar.
export default function CategoriasCursos({
  categorias,
}: {
  categorias: CategoriaCursoListable[];
}) {
  const router = useRouter();
  const [nueva, setNueva] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [porEliminar, setPorEliminar] = useState<CategoriaCursoListable | null>(
    null
  );

  async function crear() {
    const nombre = nueva.trim();
    if (!nombre) return;
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch("/api/categorias-cursos", {
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
      const res = await fetch(`/api/categorias-cursos/${id}`, {
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

  async function alternarActiva(categoria: CategoriaCursoListable) {
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch(`/api/categorias-cursos/${categoria.id}`, {
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

  async function eliminar(categoria: CategoriaCursoListable) {
    setOcupado(true);
    setError(null);
    try {
      const res = await fetchConTimeout(`/api/categorias-cursos/${categoria.id}`, {
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

  return (
    <div className="panel-box">
      <div className="panel-box-head">
        <h2>Categorías</h2>
        <p>
          Agrupá los cursos por rubro. Las categorías se eligen desde un
          selector al crear o editar un curso.
        </p>
      </div>

      <div className="categorias-crear">
        <input
          type="text"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Nombre de la nueva categoría"
          aria-label="Nombre de la nueva categoría"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              crear();
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
      </div>

      {error && <p className="form-error">{error}</p>}

      {categorias.length === 0 ? (
        <p className="form-aviso">
          Todavía no hay categorías. Creá la primera para poder clasificar los
          cursos.
        </p>
      ) : (
        <ul className="categorias-lista">
          {categorias.map((categoria) => (
            <li key={categoria.id} className="categoria-fila">
              {editandoId === categoria.id ? (
                <>
                  <input
                    type="text"
                    value={editandoNombre}
                    onChange={(e) => setEditandoNombre(e.target.value)}
                    aria-label={`Nombre de ${categoria.nombre}`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        guardar(categoria.id);
                      }
                      if (e.key === "Escape") setEditandoId(null);
                    }}
                  />
                  <div className="acciones-curso">
                    <button
                      type="button"
                      className="link-accion"
                      onClick={() => guardar(categoria.id)}
                      disabled={ocupado}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="link-accion"
                      onClick={() => setEditandoId(null)}
                      disabled={ocupado}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="categoria-info">
                    <strong>{categoria.nombre}</strong>
                    <small>
                      {categoria.cursos}{" "}
                      {categoria.cursos === 1 ? "curso" : "cursos"} ·{" "}
                      {categoria.activo ? "activa" : "inactiva"}
                    </small>
                  </div>
                  <div className="acciones-curso">
                    <button
                      type="button"
                      className="link-accion"
                      onClick={() => {
                        setEditandoId(categoria.id);
                        setEditandoNombre(categoria.nombre);
                      }}
                      disabled={ocupado}
                    >
                      Renombrar
                    </button>
                    <button
                      type="button"
                      className="link-accion"
                      onClick={() => alternarActiva(categoria)}
                      disabled={ocupado}
                    >
                      {categoria.activo ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      className="link-accion link-eliminar"
                      onClick={() => {
                        setError(null);
                        setPorEliminar(categoria);
                      }}
                      disabled={ocupado}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {porEliminar && (
        <ConfirmDialog
          abierto
          titulo="Eliminar la categoría"
          destructivo
          ocupado={ocupado}
          confirmar="Eliminar"
          mensaje={`Se va a eliminar la categoría "${porEliminar.nombre}".${
            porEliminar.cursos > 0
              ? ` Los ${porEliminar.cursos} curso${
                  porEliminar.cursos === 1 ? "" : "s"
                } que la usan quedan sin categoría.`
              : ""
          } Esta acción no se puede deshacer.`}
          onCancelar={() => setPorEliminar(null)}
          onConfirmar={() => eliminar(porEliminar)}
        />
      )}
    </div>
  );
}
