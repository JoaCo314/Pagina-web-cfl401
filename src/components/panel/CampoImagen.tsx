"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type EstadoImagen = { archivo: File | null; quitar: boolean };

type Contexto = "tarjeta" | "banner" | "logo";

/// Proporciones y formato de salida según dónde se muestra la imagen.
const CONTEXTOS = {
  tarjeta: { aspecto: { w: 16, h: 9 }, formato: "image/jpeg" as const },
  banner: { aspecto: { w: 21, h: 9 }, formato: "image/jpeg" as const },
  logo: { aspecto: { w: 1, h: 1 }, formato: "image/png" as const },
} as const;

const SALIDA_MAX = 1600;
const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const PASO_ZOOM = 0.25;

/// La imagen se pinta desde su esquina superior izquierda (translate + scale
/// con origen 0,0). El recorte visible es la ventana [tx, tx+ancho]/s en
/// píxeles originales de la foto.
function clampa(tx: number, tamañoImg: number, tamañoVista: number): number {
  const min = tamañoVista - tamañoImg;
  return Math.min(Math.max(tx, min), 0);
}

function dimensionesSalida(aspecto: { w: number; h: number }) {
  if (aspecto.w >= aspecto.h) {
    return {
      w: SALIDA_MAX,
      h: Math.round((SALIDA_MAX * aspecto.h) / aspecto.w),
    };
  }
  return {
    w: Math.round((SALIDA_MAX * aspecto.w) / aspecto.h),
    h: SALIDA_MAX,
  };
}

/// Panel de recorte: grilla, zoom y arrastre sobre el estadio, con preview
/// del resultado final. `origen` es la imagen ya decodificada (new Image)
/// que se usa como fuente de verdad para preview y export.
function EditorRecorte({
  src,
  origen,
  ancho,
  alto,
  contexto,
  nombreBase,
  onAplicar,
  onCancelar,
}: {
  src: string;
  origen: HTMLImageElement;
  ancho: number;
  alto: number;
  contexto: Contexto;
  nombreBase: string;
  onAplicar: (file: File) => void;
  onCancelar: () => void;
}) {
  const { aspecto, formato } = CONTEXTOS[contexto];
  const escenarioRef = useRef<HTMLDivElement>(null);
  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const previewLienzoRef = useRef<HTMLCanvasElement>(null);

  const [medidas, setMedidas] = useState({ w: 320, h: 180 });
  const [previewTamaño, setPreviewTamaño] = useState({ w: 1, h: 1 });
  const [escala, setEscala] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  // Hasta que el usuario mueve o hace zoom, la imagen parte centrada.
  const [ajustado, setAjustado] = useState(false);
  const arrastre = useRef<{ px: number; py: number; tx0: number; ty0: number } | null>(null);

  useLayoutEffect(() => {
    const el = escenarioRef.current;
    if (!el) return;
    const medir = () => setMedidas({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = previewBoxRef.current;
    if (!el) return;
    const medir = () => setPreviewTamaño({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cubrir =
    ancho && alto ? Math.max(medidas.w / ancho, medidas.h / alto) : 1;
  const s = cubrir * escala;
  const baseX = ajustado ? tx : (medidas.w - ancho * cubrir) / 2;
  const baseY = ajustado ? ty : (medidas.h - alto * cubrir) / 2;
  const txn = clampa(baseX, ancho * s, medidas.w);
  const tyn = clampa(baseY, alto * s, medidas.h);

  const rect = useMemo(
    () =>
      ancho && alto && s > 0
        ? {
            x: -txn / s,
            y: -tyn / s,
            w: medidas.w / s,
            h: medidas.h / s,
          }
        : { x: 0, y: 0, w: 1, h: 1 },
    [txn, tyn, s, medidas, ancho, alto]
  );

  // Zoom con la rueda apuntando al cursor (non-passive para frenar el scroll).
  const paramsRef = useRef({ escala, txn, tyn });
  useEffect(() => {
    paramsRef.current = { escala, txn, tyn };
  });
  useEffect(() => {
    const el = escenarioRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = paramsRef.current;
      const b = el.getBoundingClientRect();
      const px = e.clientX - b.left;
      const py = e.clientY - b.top;
      const delta = e.deltaY < 0 ? PASO_ZOOM : -PASO_ZOOM;
      const nueva = Math.min(
        Math.max(Math.round((p.escala + delta) * 100) / 100, ZOOM_MIN),
        ZOOM_MAX
      );
      if (nueva === p.escala) return;
      const k = nueva / p.escala;
      setEscala(nueva);
      setTx(px + (p.txn - px) * k);
      setTy(py + (p.tyn - py) * k);
      setAjustado(true);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Preview en vivo: dibuja exactamente el rect del export.
  useEffect(() => {
    const lienzo = previewLienzoRef.current;
    if (!lienzo || rect.w <= 0) return;
    lienzo.width = previewTamaño.w;
    lienzo.height = previewTamaño.h;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(origen, rect.x, rect.y, rect.w, rect.h, 0, 0, lienzo.width, lienzo.height);
  }, [rect, previewTamaño, origen]);

  function enPunteroDown(e: React.PointerEvent<HTMLDivElement>) {
    arrastre.current = {
      px: e.clientX,
      py: e.clientY,
      tx0: txn,
      ty0: tyn,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function enPunteroMove(e: React.PointerEvent<HTMLDivElement>) {
    const a = arrastre.current;
    if (!a) return;
    setTx(a.tx0 + (e.clientX - a.px));
    setTy(a.ty0 + (e.clientY - a.py));
    setAjustado(true);
  }

  function enPunteroUp(e: React.PointerEvent<HTMLDivElement>) {
    if (arrastre.current) e.currentTarget.releasePointerCapture(e.pointerId);
    arrastre.current = null;
  }

  function ajustarZoom(delta: number) {
    setEscala((prev) =>
      Math.min(Math.max(Math.round((prev + delta) * 100) / 100, ZOOM_MIN), ZOOM_MAX)
    );
    setAjustado(true);
  }

  function restablecer() {
    setEscala(1);
    setAjustado(false);
  }

  function exportar() {
    if (!lienzoRef.current || rect.w <= 0 || rect.h <= 0) return;
    const out = dimensionesSalida(aspecto);
    lienzoRef.current.width = out.w;
    lienzoRef.current.height = out.h;
    const ctx = lienzoRef.current.getContext("2d");
    if (!ctx) return;
    if (formato === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, out.w, out.h);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(origen, rect.x, rect.y, rect.w, rect.h, 0, 0, out.w, out.h);
    lienzoRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        const ext = formato === "image/png" ? "png" : "jpg";
        onAplicar(new File([blob], `${nombreBase}.${ext}`, { type: blob.type }));
      },
      formato,
      formato === "image/jpeg" ? 0.92 : undefined
    );
  }

  const estiloImagen = { transform: `translate(${txn}px, ${tyn}px) scale(${s})` };

  return (
    <div className="imagen-editor" role="dialog" aria-modal="true" aria-label="Ajustar imagen">
      <p className="imagen-editor-titulo">
        Arrastrá la imagen dentro de la grilla para moverla libremente. Ajustá el
        zoom con los botones o con la rueda del mouse sobre la imagen.
      </p>
      <div className="imagen-editor-columnas">
        <div className="imagen-editor-ajuste">
          <div
            className="imagen-estadio"
            ref={escenarioRef}
            style={{ aspectRatio: `${aspecto.w} / ${aspecto.h}` }}
            onPointerDown={enPunteroDown}
            onPointerMove={enPunteroMove}
            onPointerUp={enPunteroUp}
            onPointerCancel={enPunteroUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="imagen-estadio-img"
              draggable={false}
              style={estiloImagen}
            />
            <div className="imagen-grid" aria-hidden="true" />
            <div
              className="imagen-zoom"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerMove={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={() => ajustarZoom(-PASO_ZOOM)} aria-label="Disminuir zoom">−</button>
              <span className="imagen-zoom-valor">{(escala * 100).toFixed(0)}%</span>
              <button type="button" onClick={() => ajustarZoom(PASO_ZOOM)} aria-label="Aumentar zoom">+</button>
              <button type="button" className="imagen-zoom-restablecer" onClick={restablecer}>
                Restablecer
              </button>
            </div>
          </div>
        </div>

        <div className="imagen-preview-final">
          <span className="imagen-preview-final-titulo">Así quedará:</span>
          {contexto === "banner" && (
            <div className="preview-banner" ref={previewBoxRef}>
              <canvas ref={previewLienzoRef} className="preview-lienzo" />
              <span className="preview-banner-capa" aria-hidden="true" />
              <span className="preview-banner-fake" aria-hidden="true" />
            </div>
          )}
          {contexto === "logo" && (
            <div className="preview-logo" ref={previewBoxRef}>
              <canvas ref={previewLienzoRef} className="preview-lienzo" />
            </div>
          )}
          {contexto === "tarjeta" && (
            <div className="preview-tarjeta">
              <div className="preview-tarjeta-img-box" ref={previewBoxRef}>
                <canvas ref={previewLienzoRef} className="preview-lienzo" />
              </div>
              <span className="preview-tarjeta-linea" aria-hidden="true" />
              <span className="preview-tarjeta-linea corta" aria-hidden="true" />
            </div>
          )}
          <span className="imagen-preview-final-nota">
            El recorte se aplica al tamaño final de cada sección.
          </span>
        </div>
      </div>

      <div className="imagen-editor-acciones">
        <button type="button" className="imagen-editor-cancelar" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="btn-primary" onClick={exportar}>
          Aplicar recorte
        </button>
      </div>
      <canvas ref={lienzoRef} hidden />
    </div>
  );
}

type DraftRecorte = { url: string; img: HTMLImageElement };

/// Campo reutilizable para subir una imagen desde el panel. Al elegir un
/// archivo se abre el editor de recorte; el archivo recortado se sube cuando
/// se guarda el formulario.
export default function CampoImagen({
  valorActual,
  onChange,
  etiqueta = "Imagen (opcional)",
  contexto = "tarjeta",
}: {
  valorActual: string | null;
  onChange: (estado: EstadoImagen) => void;
  etiqueta?: string;
  contexto?: Contexto;
}) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState<DraftRecorte | null>(null);
  const [aplicado, setAplicado] = useState<{ file: File; url: string } | null>(null);
  const [quitar, setQuitar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function limpiarUrl(url: string | null) {
    if (url) URL.revokeObjectURL(url);
  }

  function precargar(url: string, ok: (img: HTMLImageElement) => void) {
    const img = new Image();
    img.onload = () => ok(img);
    img.src = url;
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    // Solo se abre el editor cuando la imagen ya está decodificada.
    precargar(url, (img) => {
      setDraft({ url, img });
      setAplicado(null);
      setQuitar(false);
      setEditando(true);
      onChange({ archivo: null, quitar: false });
    });
  }

  function aplicar(file: File) {
    if (aplicado) limpiarUrl(aplicado.url);
    const url = URL.createObjectURL(file);
    setAplicado({ file, url });
    setDraft(null);
    setEditando(false);
    onChange({ archivo: file, quitar: false });
  }

  function reencuadrar() {
    const url = aplicado?.url;
    if (!url) return;
    precargar(url, (img) => {
      setDraft({ url, img });
      setEditando(true);
    });
  }

  function cancelar() {
    if (aplicado) {
      setEditando(false);
      return;
    }
    if (draft) limpiarUrl(draft.url);
    setDraft(null);
    setEditando(false);
  }

  function quitarImagen() {
    if (inputRef.current) inputRef.current.value = "";
    if (aplicado) limpiarUrl(aplicado.url);
    setAplicado(null);
    if (draft) limpiarUrl(draft.url);
    setDraft(null);
    setQuitar(true);
    setEditando(false);
    onChange({ archivo: null, quitar: true });
  }

  function deshacer() {
    if (inputRef.current) inputRef.current.value = "";
    if (aplicado) limpiarUrl(aplicado.url);
    setAplicado(null);
    if (draft) limpiarUrl(draft.url);
    setDraft(null);
    setQuitar(false);
    setEditando(false);
    onChange({ archivo: null, quitar: false });
  }

  const mostrar = quitar ? null : aplicado?.url ?? valorActual;

  return (
    <div className="form-field form-field-full">
      <span>{etiqueta}</span>

      {mostrar ? (
        <div className="imagen-visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="imagen-preview" src={mostrar} alt="Vista previa" />
          {aplicado && (
            <button
              type="button"
              className="link-accion"
              onClick={reencuadrar}
            >
              Re-encuadrar
            </button>
          )}
        </div>
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
        {quitar && (aplicado || valorActual) && (
          <button type="button" className="link-accion" onClick={deshacer}>
            Deshacer
          </button>
        )}
      </div>

      <small className="form-hint">
        JPG, PNG, WEBP o GIF, hasta 5 MB. Al elegir el archivo podés mover y
        hacer zoom sobre una grilla para recortarla; la imagen recortada
        reemplaza a la anterior al guardar.
      </small>

      {editando && draft && (
        <EditorRecorte
          src={draft.url}
          origen={draft.img}
          ancho={draft.img.naturalWidth}
          alto={draft.img.naturalHeight}
          contexto={contexto}
          nombreBase="imagen-cfl"
          onAplicar={aplicar}
          onCancelar={cancelar}
        />
      )}
    </div>
  );
}