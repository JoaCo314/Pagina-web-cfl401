"use client";

import { useRef, useState } from "react";

export type EstadoImagen = { archivo: File | null; quitar: boolean };

/// Campo reutilizable para subir una imagen desde el panel. Muestra la imagen
/// actual (o la recién elegida) y permite reemplazarla o quitarla. El archivo
/// se sube al guardar el formulario; acá solo se administra la selección.
export default function CampoImagen({
  valorActual,
  onChange,
  etiqueta = "Imagen (opcional)",
}: {
  valorActual: string | null;
  onChange: (estado: EstadoImagen) => void;
  etiqueta?: string;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [quitar, setQuitar] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setArchivo(file);
    setQuitar(false);
    onChange({ archivo: file, quitar: false });
  }

  function quitarImagen() {
    if (inputRef.current) inputRef.current.value = "";
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setArchivo(null);
    setQuitar(true);
    onChange({ archivo: null, quitar: true });
  }

  function deshacer() {
    if (inputRef.current) inputRef.current.value = "";
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setArchivo(null);
    setQuitar(false);
    onChange({ archivo: null, quitar: false });
  }

  const mostrar = quitar ? null : preview ?? valorActual;
  const teniaImagen = Boolean(valorActual);

  return (
    <div className="form-field form-field-full">
      <span>{etiqueta}</span>

      {mostrar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="imagen-preview" src={mostrar} alt="Vista previa" />
      ) : (
        <p className="form-aviso">Sin imagen cargada.</p>
      )}

      <div className="imagen-controles">
        <label className="imagen-subir">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onFile}
            aria-label={etiqueta}
          />
          <svg
            className="imagen-subir-icono"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Subir imagen</span>
        </label>
        {mostrar && (
          <button
            type="button"
            className="link-accion link-eliminar"
            onClick={quitarImagen}
          >
            Quitar imagen
          </button>
        )}
        {quitar && (teniaImagen || archivo) && (
          <button
            type="button"
            className="link-accion"
            onClick={deshacer}
          >
            Deshacer
          </button>
        )}
      </div>

      <small className="form-hint">
        JPG, PNG, WEBP o GIF, hasta 5 MB. La imagen reemplaza a la anterior al
        guardar.
      </small>
    </div>
  );
}
