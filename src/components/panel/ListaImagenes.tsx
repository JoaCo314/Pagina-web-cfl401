"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/panel/ConfirmDialog";
import { fetchConTimeout, TimeoutError } from "@/lib/fetchTimeout";

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
  // `timeZone: UTC` porque el servidor guarda el instante en UTC: sin esto la
  // fecha puede corrimiento un día según la zona horaria del contenedor.
  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ListaImagenes({ inicial }: { inicial: ImagenItem[] }) {
  const router = useRouter();
  const [imagenes, setImagenes] = useState<ImagenItem[]>(inicial);
  const [error, setError] = useState<string | null>(null);
  const [borrandoId, setBorrandoId] = useState<number | null>(null);
  const [porBorrar, setPorBorrar] = useState<ImagenItem | null>(null);

  async function eliminar(img: ImagenItem) {
    setBorrandoId(img.id);
    setError(null);
    try {
      const res = await fetchConTimeout(`/api/imagenes/${img.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        // 409: la imagen todavía se usa en algún contenido. El mensaje del
        // servidor dice dónde, así que no hace falta un alert aparte.
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(
          data?.error ??
            (res.status === 409
              ? "La imagen está en uso y no se puede borrar."
              : "No se pudo borrar la imagen. Intentá nuevamente.")
        );
        setPorBorrar(null);
        return;
      }
      setPorBorrar(null);
      setImagenes((prev) => prev.filter((i) => i.id !== img.id));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof TimeoutError
          ? "El servidor tardó demasiado. Intentá nuevamente."
          : "No se pudo borrar la imagen. Revisá tu conexión e intentá nuevamente."
      );
    } finally {
      setBorrandoId(null);
    }
  }

  if (imagenes.length === 0) {
    return (
      <p className="panel-vacio">
        Todavía no hay imágenes subidas desde el panel.
      </p>
    );
  }

  return (
    <div className="imagenes-grid-wrap">
      {/* El error va arriba y no reemplaza la grilla: si el servidor rechaza el
          borrado porque la imagen se usa, hay que poder ver el resto. */}
      {error && (
        <p className="form-error" role="alert" aria-live="assertive">
          {error}
        </p>
      )}

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
              onClick={() => {
                setError(null);
                setPorBorrar(img);
              }}
              disabled={borrandoId === img.id}
            >
              {borrandoId === img.id ? "Borrando…" : "Borrar"}
            </button>
          </div>
        ))}
      </div>

      {porBorrar && (
        <ConfirmDialog
          abierto
          titulo="Borrar la imagen"
          destructivo
          ocupado={borrandoId === porBorrar.id}
          confirmar="Borrar"
          mensaje={`Se va a borrar "${
            porBorrar.nombre || `Imagen ${porBorrar.id}`
          }". Si todavía se usa en un curso, una noticia o el sitio, el servidor la va a rechazar y te va a decir dónde.`}
          onCancelar={() => setPorBorrar(null)}
          onConfirmar={() => eliminar(porBorrar)}
        />
      )}
    </div>
  );
}