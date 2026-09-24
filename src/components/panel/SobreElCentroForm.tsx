"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EditorTextoEnriquecido from "@/components/panel/EditorTextoEnriquecido";
import { extraerTextoPlano, htmlDesdeTextoPlano } from "@/lib/htmlEnriquecidoUtil";
import { subirImagen, validarArchivoImagen } from "@/lib/imagenesCliente";

export type HitoForm = { anio: string; titulo: string; texto: string };
export type EstadisticaForm = { valor: string; etiqueta: string };
export type FotoForm = { url: string; leyenda: string };

export type SobreFormInicial = {
  intro: string;
  introHtml: string;
  misionTitulo: string;
  misionTexto: string;
  misionTextoHtml: string;
  historiaTitulo: string;
  historiaTexto: string;
  historiaTextoHtml: string;
  hitos: HitoForm[];
  estadisticasTitulo: string;
  estadisticas: EstadisticaForm[];
  galeriaTitulo: string;
  galeria: FotoForm[];
  activo: boolean;
};

const INICIAL: SobreFormInicial = {
  intro: "",
  introHtml: "",
  misionTitulo: "",
  misionTexto: "",
  misionTextoHtml: "",
  historiaTitulo: "",
  historiaTexto: "",
  historiaTextoHtml: "",
  hitos: [],
  estadisticasTitulo: "",
  estadisticas: [],
  galeriaTitulo: "",
  galeria: [],
  activo: true,
};

export default function SobreElCentroForm({
  inicial,
}: {
  inicial: SobreFormInicial;
}) {
  const router = useRouter();
  const [datos, setDatos] = useState<SobreFormInicial>(inicial ?? INICIAL);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  function setCampo(campo: keyof SobreFormInicial, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  function sincronizarEnriquecido(
    campoHtml: keyof SobreFormInicial,
    campoPlano: keyof SobreFormInicial,
    html: string
  ) {
    setDatos((prev) => ({
      ...prev,
      [campoHtml]: html,
      [campoPlano]: extraerTextoPlano(html),
    }));
  }

  function setHito(i: number, campo: keyof HitoForm, valor: string) {
    setDatos((prev) => ({
      ...prev,
      hitos: prev.hitos.map((hito, j) =>
        j === i ? { ...hito, [campo]: valor } : hito
      ),
    }));
  }

  function setEstadistica(i: number, campo: keyof EstadisticaForm, valor: string) {
    setDatos((prev) => ({
      ...prev,
      estadisticas: prev.estadisticas.map((e, j) =>
        j === i ? { ...e, [campo]: valor } : e
      ),
    }));
  }

  function setFoto(i: number, campo: keyof FotoForm, valor: string) {
    setDatos((prev) => ({
      ...prev,
      galeria: prev.galeria.map((foto, j) =>
        j === i ? { ...foto, [campo]: valor } : foto
      ),
    }));
  }

  async function agregarFoto() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setError(null);
    const errorArchivo = validarArchivoImagen(file);
    if (errorArchivo) {
      setError(errorArchivo);
      return;
    }

    setSubiendo(true);
    try {
      const subida = await subirImagen(file);
      if (!subida.ok) {
        setError(subida.error);
        return;
      }
      setDatos((prev) => ({
        ...prev,
        galeria: [...prev.galeria, { url: subida.url, leyenda: "" }],
      }));
    } catch {
      setError("No se pudo subir la imagen. Intentá nuevamente.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
      setSubiendo(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const res = await fetch("/api/sobre-el-centro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (res.ok) {
        router.refresh();
        setError(null);
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "No se pudo guardar el contenido.");
    } catch {
      setError("No se pudo guardar el contenido. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="curso-form" onSubmit={onSubmit} noValidate>
      <div className="panel-form-seccion">
        <div className="panel-form-seccion-head">
          <h2>Introducción</h2>
          <p>Párrafo que aparece debajo del título de la página.</p>
        </div>
        <div className="form-field form-field-full">
          <EditorTextoEnriquecido
            id="sobre-intro"
            etiqueta="Introducción"
            valorInicial={
              datos.introHtml ||
              htmlDesdeTextoPlano(inicial?.intro ?? "")
            }
            minAlto={120}
            onCambio={(html) =>
              sincronizarEnriquecido("introHtml", "intro", html)
            }
          />
        </div>
      </div>

      <div className="panel-form-seccion">
        <div className="panel-form-seccion-head">
          <h2>Misión / identidad</h2>
          <p>
            Sección de presentación institucional. Si queda vacía, no se muestra
            en el sitio.
          </p>
        </div>
        <label className="form-field form-field-full">
          <span>Título (opcional)</span>
          <input
            type="text"
            value={datos.misionTitulo}
            onChange={(e) => setCampo("misionTitulo", e.target.value)}
            placeholder="Ej: Nuestra misión"
          />
        </label>
        <div className="form-field form-field-full">
          <EditorTextoEnriquecido
            id="sobre-mision-texto"
            etiqueta="Texto de la misión"
            valorInicial={
              datos.misionTextoHtml ||
              htmlDesdeTextoPlano(inicial?.misionTexto ?? "")
            }
            onCambio={(html) =>
              sincronizarEnriquecido("misionTextoHtml", "misionTexto", html)
            }
          />
        </div>
      </div>

      <div className="panel-form-seccion">
        <div className="panel-form-seccion-head">
          <h2>Historia y línea de tiempo</h2>
          <p>
            Narración breve y/o hitos ordenados por año. Cada hito se muestra
            como un punto de la línea de tiempo.
          </p>
        </div>
        <label className="form-field form-field-full">
          <span>Título (opcional)</span>
          <input
            type="text"
            value={datos.historiaTitulo}
            onChange={(e) => setCampo("historiaTitulo", e.target.value)}
            placeholder="Ej: Nuestra historia"
          />
        </label>
        <div className="form-field form-field-full">
          <EditorTextoEnriquecido
            id="sobre-historia-texto"
            etiqueta="Texto de la historia"
            valorInicial={
              datos.historiaTextoHtml ||
              htmlDesdeTextoPlano(inicial?.historiaTexto ?? "")
            }
            onCambio={(html) =>
              sincronizarEnriquecido("historiaTextoHtml", "historiaTexto", html)
            }
          />
        </div>

        <div className="form-field form-field-full">
          <span>Hitos (opcional)</span>
          {datos.hitos.length === 0 ? (
            <p className="form-aviso">
              Todavía no hay hitos. Agregá el primero con el botón de abajo.
            </p>
          ) : (
            <div className="filas-dinamicas">
              {datos.hitos.map((hito, i) => (
                <div key={i} className="fila-dinamica fila-hito">
                  <input
                    type="text"
                    value={hito.anio}
                    onChange={(e) => setHito(i, "anio", e.target.value)}
                    placeholder="Año"
                    aria-label={`Año del hito ${i + 1}`}
                    className="fila-hito-anio"
                  />
                  <input
                    type="text"
                    value={hito.titulo}
                    onChange={(e) => setHito(i, "titulo", e.target.value)}
                    placeholder="Título del hito"
                    aria-label={`Título del hito ${i + 1}`}
                  />
                  <input
                    type="text"
                    value={hito.texto}
                    onChange={(e) => setHito(i, "texto", e.target.value)}
                    placeholder="Descripción"
                    aria-label={`Descripción del hito ${i + 1}`}
                  />
                  <button
                    type="button"
                    className="link-accion link-eliminar"
                    onClick={() =>
                      setDatos((prev) => ({
                        ...prev,
                        hitos: prev.hitos.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="btn-ghost-dark btn-sm"
            disabled={datos.hitos.length >= 50}
            onClick={() =>
              setDatos((prev) => ({
                ...prev,
                hitos: [...prev.hitos, { anio: "", titulo: "", texto: "" }],
              }))
            }
          >
            + Agregar hito
          </button>
        </div>
      </div>

      <div className="panel-form-seccion">
        <div className="panel-form-seccion-head">
          <h2>Estadísticas</h2>
          <p>Números destacados (ej: años, egresados, cursos). Opcional.</p>
        </div>
        <label className="form-field form-field-full">
          <span>Título (opcional)</span>
          <input
            type="text"
            value={datos.estadisticasTitulo}
            onChange={(e) => setCampo("estadisticasTitulo", e.target.value)}
            placeholder="Ej: Números que nos respaldan"
          />
        </label>

        <div className="form-field form-field-full">
          <span>Indicadores (opcional)</span>
          {datos.estadisticas.length === 0 ? (
            <p className="form-aviso">
              Todavía no hay indicadores cargados.
            </p>
          ) : (
            <div className="filas-dinamicas">
              {datos.estadisticas.map((stat, i) => (
                <div key={i} className="fila-dinamica">
                  <input
                    type="text"
                    value={stat.valor}
                    onChange={(e) => setEstadistica(i, "valor", e.target.value)}
                    placeholder="Valor (ej: 30+)"
                    aria-label={`Valor del indicador ${i + 1}`}
                  />
                  <input
                    type="text"
                    value={stat.etiqueta}
                    onChange={(e) =>
                      setEstadistica(i, "etiqueta", e.target.value)
                    }
                    placeholder="Etiqueta (ej: años de historia)"
                    aria-label={`Etiqueta del indicador ${i + 1}`}
                  />
                  <button
                    type="button"
                    className="link-accion link-eliminar"
                    onClick={() =>
                      setDatos((prev) => ({
                        ...prev,
                        estadisticas: prev.estadisticas.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="btn-ghost-dark btn-sm"
            disabled={datos.estadisticas.length >= 12}
            onClick={() =>
              setDatos((prev) => ({
                ...prev,
                estadisticas: [...prev.estadisticas, { valor: "", etiqueta: "" }],
              }))
            }
          >
            + Agregar indicador
          </button>
        </div>
      </div>

      <div className="panel-form-seccion">
        <div className="panel-form-seccion-head">
          <h2>Galería de fotos históricas</h2>
          <p>
            Imágenes históricas del centro. Las fotos se suben al guardar la
            selección y se borran si las quitás del listado.
          </p>
        </div>
        <label className="form-field form-field-full">
          <span>Título (opcional)</span>
          <input
            type="text"
            value={datos.galeriaTitulo}
            onChange={(e) => setCampo("galeriaTitulo", e.target.value)}
            placeholder="Ej: Galería histórica"
          />
        </label>

        <div className="form-field form-field-full">
          <span>Fotos (opcional)</span>
          {datos.galeria.length === 0 ? (
            <p className="form-aviso">Todavía no hay fotos en la galería.</p>
          ) : (
            <div className="galeria-panel">
              {datos.galeria.map((foto, i) => (
                <div key={i} className="galeria-panel-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foto.url} alt="Vista previa de la galería" />
                  <input
                    type="text"
                    value={foto.leyenda}
                    onChange={(e) => setFoto(i, "leyenda", e.target.value)}
                    placeholder="Leyenda (opcional)"
                    aria-label={`Leyenda de la foto ${i + 1}`}
                  />
                  <button
                    type="button"
                    className="link-accion link-eliminar"
                    onClick={() =>
                      setDatos((prev) => ({
                        ...prev,
                        galeria: prev.galeria.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="visually-hidden"
            id="archivo-galeria"
            onChange={agregarFoto}
          />
          <button
            type="button"
            className="btn-ghost-dark btn-sm"
            disabled={subiendo || datos.galeria.length >= 24}
            onClick={() => fileRef.current?.click()}
          >
            {subiendo ? "Subiendo…" : "+ Agregar foto"}
          </button>
        </div>
      </div>

      <label className="form-field form-field-full form-toggle">
        <input
          type="checkbox"
          checked={datos.activo}
          onChange={(e) =>
            setDatos((prev) => ({ ...prev, activo: e.target.checked }))
          }
        />
        <span>Página visible en el sitio público</span>
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary btn-sm" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar cambios"}
        </button>
        <a
          href="/panel"
          className="btn-ghost-dark"
          onClick={(e) => {
            e.preventDefault();
            router.push("/panel");
          }}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}