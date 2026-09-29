"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ImagenItem = {
  id: number;
  nombre: string;
  mimeType: string;
  tamano: number;
  createdAt: string;
  url: string;
};

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ListaImagenes({ inicial }: { inicial: ImagenItem[] }) {
  const router = useRouter();
  const [imagenes, setImagenes] = useState<ImagenItem[]>(inicial);
  const [error, setError] = useState<string | null>(null);
  const [borrandoId, setBorrandoId] = useState<number | null>(null);

  async function eliminar(img: ImagenItem) {
    if (
      !window.confirm(
        `¿Borrar "${img.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    setBorrandoId(img.id);
    setError(null);
    try {
      const res = await fetch(`/api/imagenes/${img.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        if (res.status === 409) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          window.alert(
            data?.error ?? "La imagen está en uso y no se puede borrar."
          );
          return;
        }
        setError("No se pudo borrar la imagen. Intentá nuevamente.");
        return;
      }
      setImagenes((prev) => prev.filter((i) => i.id !== img.id));
      router.refresh();
    } catch {
      setError("No se pudo borrar la imagen. Intentá nuevamente.");
    } finally {
      setBorrandoId(null);
    }
  }

  if (error) return <p className="form-error">{error}</p>;

  if (imagenes.length === 0) {
    return (
      <p className="panel-vacio">
        Todavía no hay imágenes subidas desde el panel.
      </p>
    );
  }

  return (
    <div className="imagenes-grid">
      {imagenes.map((img) => (
        <div key={img.id} className="imagenes-grid-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.nombre} loading="lazy" />
          <div className="imagenes-grid-datos">
            <strong title={img.nombre}>
              {img.nombre || `Imagen ${img.id}`}
            </strong>
            <span>
              {img.mimeType} · {formatearTamano(img.tamano)} ·{" "}
              {formatearFecha(img.createdAt)}
            </span>
          </div>
          <button
            type="button"
            className="btn-sm btn-ghost-dark imagenes-grid-borrar"
            onClick={() => eliminar(img)}
            disabled={borrandoId === img.id}
          >
            {borrandoId === img.id ? "Borrando…" : "Borrar"}
          </button>
        </div>
      ))}
    </div>
  );
}