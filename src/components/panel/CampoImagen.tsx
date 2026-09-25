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

type Rect = { x: number; y: number; w: number; h: number };

function recorteDesdeEscenario(
  escala: number,
  tx: number,
  ty: number,
  ancho: number,
  alto: number,
  imgW: number,
  imgH: number
): Rect {
  const cubrir = Math.max(ancho / imgW, alto / imgH);
  const s = cubrir * escala;
  const srcW = ancho / s;
  const srcH = alto / s;
  let x = imgW / 2 - tx / s - srcW / 2;
  let y = imgH / 2 - ty / s - srcH / 2;
  x = Math.min(Math.max(x, 0), Math.max(imgW - srcW, 0));
  y = Math.min(Math.max(y, 0), Math.max(imgH - srcH, 0));
  return { x, y, w: srcW, h: srcH };
}

function clampa(tx: number, anchoImg: number, anchoVista: number): number {
  const margen = Math.max((anchoImg - anchoVista) / 2, 0);
  return Math.min(Math.max(tx, -margen), margen);
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

/// Panel de recorte: grilla, zoom, arrastre y preview del resultado final.
function EditorRecorte({
  src,
  contexto,
  nombreBase,
  onAplicar,
  onCancelar,
}: {
  src: string;
  contexto: Contexto;
  nombreBase: string;
  onAplicar: (file: File) => void;
  onCancelar: () => void;
}) {
  const { aspecto, formato } = CONTEXTOS[contexto];
  const escenarioRef = useRef<HTMLDivElement>(null);
  const imgElRef = useRef<HTMLImageElement>(null);
  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const previewLienzoRef = useRef<HTMLCanvasElement>(null);

  const [medidas, setMedidas] = useState({ w: 320, h: 180 });
  const [previewTamaño, setPreviewTamaño] = useState({ w: 1, h: 1 });
  const [imgNat, setImgNat] = useState({ w: 0, h: 0 });
  const [escala, setEscala] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
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

  const cubrir = useMemo(() => {
    if (!imgNat.w || !imgNat.h) return 1;
    return Math.max(medidas.w / imgNat.w, medidas.h / imgNat.h);
  }, [imgNat, medidas]);

  const s = cubrir * escala;
  const txn = clampa(tx, imgNat.w * s, medidas.w);
  const tyn = clampa(ty, imgNat.h * s, medidas.h);

  const rect = useMemo(
    () =>
      imgNat.w && imgNat.h
        ? recorteDesdeEscenario(escala, txn, tyn, medidas.w, medidas.h, imgNat.w, imgNat.h)
        : { x: 0, y: 0, w: 1, h: 1 },
    [escala, txn, tyn, medidas, imgNat]
  );

  // Preview en vivo: dibuja el mismo rect del export en el lienzo pequeño.
  useEffect(() => {
    const lienzo = previewLienzoRef.current;
    const img = imgElRef.current;
    if (!lienzo || !img || !imgNat.w || rect.w <= 0) return;
    lienzo.width = previewTamaño.w;
    lienzo.height = previewTamaño.h;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, lienzo.width, lienzo.height);
  }, [rect, previewTamaño, imgNat]);

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
    if (!a || !imgNat.w || !imgNat.h) return;
    setTx(a.tx0 + (e.clientX - a.px));
    setTy(a.ty0 + (e.clientY - a.py));
  }

  function enPunteroUp(e: React.PointerEvent<HTMLDivElement>) {
    if (arrastre.current) e.currentTarget.releasePointerCapture(e.pointerId);
    arrastre.current = null;
  }

  function aplicarZoom(delta: number) {
    setEscala((prev) =>
      Math.min(Math.max(Math.round((prev + delta) * 100) / 100, ZOOM_MIN), ZOOM_MAX)
    );
  }

  function exportar() {
    const img = imgElRef.current;
    const lienzo = lienzoRef.current;
    if (!img || !lienzo || rect.w <= 0 || rect.h <= 0) return;
    const out = dimensionesSalida(aspecto);
    lienzo.width = out.w;
    lienzo.height = out.h;
    const ctx = lienzo.getContext("2d");
    if (!ctx) return;
    if (formato === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, out.w, out.h);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, out.w, out.h);
    lienzo.toBlob(
      (blob) => {
        if (!blob) return;
        const ext = formato === "image/png" ? "png" : "jpg";
        onAplicar(new File([blob], `${nombreBase}.${ext}`, { type: blob.type }));
      },
      formato,
      formato === "image/jpeg" ? 0.92 : undefined
    );
  }

  const mostrarStage = imgNat.w > 0 && imgNat.h > 0;
  const estiloImagen = { transform: `translate(${txn}px, ${tyn}px) scale(${s})` };

  return (
    <div className="imagen-editor" role="dialog" aria-modal="true" aria-label="Ajustar imagen">
      <p className="imagen-editor-titulo">
        Ajustá la imagen: arrastrá sobre la grilla para moverla y usá el zoom.
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
            {mostrarStage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgElRef}
                src={src}
                alt="Imagen a ajustar"
                className="imagen-estadio-img"
                draggable={false}
                style={estiloImagen}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  if (el.naturalWidth) setImgNat({ w: el.naturalWidth, h: el.naturalHeight });
                }}
              />
            )}
            <div className="imagen-grid" aria-hidden="true" />
          </div>
          <div className="imagen-zoom">
            <button type="button" onClick={() => aplicarZoom(-PASO_ZOOM)} aria-label="Disminuir zoom">−</button>
            <span className="imagen-zoom-valor">{(escala * 100).toFixed(0)}%</span>
            <button type="button" onClick={() => aplicarZoom(PASO_ZOOM)} aria-label="Aumentar zoom">+</button>
            <button
              type="button"
              className="imagen-zoom-restablecer"
              onClick={() => {
                setEscala(1);
                setTx(0);
                setTy(0);
              }}
            >
              Restablecer
            </button>
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
            El recorte se aplica al tamaño final de la sección.
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
  const [draft, setDraft] = useState<{ file: File; url: string } | null>(null);
  const [aplicado, setAplicado] = useState<{ file: File; url: string } | null>(null);
  const [quitar, setQuitar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function limpiarUrl(url: string | null) {
    if (url) URL.revokeObjectURL(url);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDraft({ file, url });
    setAplicado(null);
    setQuitar(false);
    setEditando(true);
    onChange({ archivo: null, quitar: false });
  }

  function aplicar(file: File) {
    const url = URL.createObjectURL(file);
    setAplicado({ file, url });
    if (draft) limpiarUrl(draft.url);
    setDraft(null);
    setEditando(false);
    onChange({ archivo: file, quitar: false });
  }

  function cancelar() {
    if (aplicado) {
      // Se estaba re-encuadrando: se conserva el recorte ya aplicado.
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
    onChange({ archivo: null, quitar: true });
  }

  function deshacer() {
    if (inputRef.current) inputRef.current.value = "";
    if (aplicado) limpiarUrl(aplicado.url);
    setAplicado(null);
    if (draft) limpiarUrl(draft.url);
    setDraft(null);
    setQuitar(false);
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
              onClick={() => setEditando(true)}
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

      {editando && draft?.url && (
        <EditorRecorte
          src={draft.url}
          contexto={contexto}
          nombreBase="imagen-cfl"
          onAplicar={aplicar}
          onCancelar={cancelar}
        />
      )}
    </div>
  );
}