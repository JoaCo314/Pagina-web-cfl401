"use client";
// Creado por sofia-athos - Formulario editable para banner, logo, footer y contactos
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteConfigData } from "@/lib/siteConfig";
import CampoImagen from "@/components/panel/CampoImagen";
import type { EstadoImagen } from "@/components/panel/CampoImagen";
import { subirImagen, validarArchivoImagen } from "@/lib/imagenesCliente";
import { extraerUrlIframe } from "@/lib/embed";

type Props = { inicial: SiteConfigData };

export default function SiteConfigForm({ inicial }: Props) {
  const router = useRouter();
  const [datos, setDatos] = useState<SiteConfigData>(inicial);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [estadoBanner, setEstadoBanner] = useState<EstadoImagen>({
    archivo: null,
    quitar: false,
  });
  const [estadoLogo, setEstadoLogo] = useState<EstadoImagen>({
    archivo: null,
    quitar: false,
  });
  const bannerActual = inicial.bannerImagenUrl ?? null;
  const logoActual = inicial.logoUrl ?? null;

  function setCampo<K extends keyof SiteConfigData>(key: K, val: string) {
    setDatos((prev) => ({ ...prev, [key]: val }));
    setGuardado(false);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      let bannerImagenUrl: string | null = bannerActual;
      if (estadoBanner.quitar) {
        bannerImagenUrl = null;
      } else if (estadoBanner.archivo) {
        const errorBanner = validarArchivoImagen(estadoBanner.archivo);
        if (errorBanner) {
          setError(errorBanner);
          return;
        }
        const subidaBanner = await subirImagen(estadoBanner.archivo);
        if (!subidaBanner.ok) {
          setError(subidaBanner.error);
          return;
        }
        bannerImagenUrl = subidaBanner.url;
      }

      let logoUrl: string | null = logoActual;
      if (estadoLogo.quitar) {
        logoUrl = null;
      } else if (estadoLogo.archivo) {
        const errorLogo = validarArchivoImagen(estadoLogo.archivo);
        if (errorLogo) {
          setError(errorLogo);
          return;
        }
        const subidaLogo = await subirImagen(estadoLogo.archivo);
        if (!subidaLogo.ok) {
          setError(subidaLogo.error);
          return;
        }
        logoUrl = subidaLogo.url;
      }

      const sinContacto = Object.fromEntries(
        Object.entries(datos).filter(([clave]) => !clave.startsWith("contacto"))
      );

      const res = await fetch("/api/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sinContacto,
          bannerImagenUrl: bannerImagenUrl ?? "",
          logoUrl: logoUrl ?? "",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "No se pudo guardar.");
        return;
      }
      setGuardado(true);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Intentá nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      {guardado && <p className="form-ok">Guardado correctamente. Los cambios ya están visibles en el sitio público.</p>}
      <form className="guia-form" onSubmit={onSubmit} noValidate>
        <fieldset className="guia-bloque">
          <legend>Banner azul - Front page</legend>
          <label className="form-field"><span>Píldora (ej: Preinscripción 2026 abierta)</span><input type="text" value={datos.bannerPill ?? ""} onChange={(e) => setCampo("bannerPill", e.target.value)} /></label>
          <label className="form-field"><span>Título</span><input type="text" value={datos.bannerTitulo ?? ""} onChange={(e) => setCampo("bannerTitulo", e.target.value)} /></label>
          <label className="form-field"><span>Subtítulo</span><textarea rows={3} value={datos.bannerSubtitulo ?? ""} onChange={(e) => setCampo("bannerSubtitulo", e.target.value)} /></label>
          <CampoImagen
            valorActual={bannerActual}
            onChange={setEstadoBanner}
            contexto="banner"
            etiqueta="Imagen del banner (opcional)"
          />
        </fieldset>

        <fieldset className="guia-bloque">
          <legend>Logo</legend>
          <CampoImagen
            valorActual={logoActual}
            onChange={setEstadoLogo}
            contexto="logo"
            etiqueta="Logo (imagen)"
          />
          <label className="form-field"><span>Alt del logo</span><input type="text" value={datos.logoAlt ?? ""} onChange={(e) => setCampo("logoAlt", e.target.value)} /></label>
        </fieldset>

        <fieldset className="guia-bloque">
          <legend>Footer</legend>
          <label className="form-field"><span>Título CFL 401</span><input type="text" value={datos.footerCflTitulo ?? ""} onChange={(e) => setCampo("footerCflTitulo", e.target.value)} /></label>
          <label className="form-field"><span>Texto debajo de CFL 401</span><textarea rows={2} value={datos.footerCflTexto ?? ""} onChange={(e) => setCampo("footerCflTexto", e.target.value)} /></label>
          <label className="form-field"><span>Email footer</span><input type="text" value={datos.footerEmail ?? ""} onChange={(e) => setCampo("footerEmail", e.target.value)} /></label>
          <label className="form-field"><span>Teléfono footer</span><input type="text" value={datos.footerTelefono ?? ""} onChange={(e) => setCampo("footerTelefono", e.target.value)} /></label>
          <label className="form-field"><span>Dirección footer</span><input type="text" value={datos.footerDireccion ?? ""} onChange={(e) => setCampo("footerDireccion", e.target.value)} /></label>
          <label className="form-field"><span>Horarios footer</span><input type="text" value={datos.footerHorarios ?? ""} onChange={(e) => setCampo("footerHorarios", e.target.value)} /></label>
          <label className="form-field"><span>Copy (©...)</span><input type="text" value={datos.footerCopy ?? ""} onChange={(e) => setCampo("footerCopy", e.target.value)} /></label>
        </fieldset>

        <fieldset className="guia-bloque">
          <legend>Ubicación (mapa en la portada)</legend>
          <label className="form-field"><span>Título del bloque</span><input type="text" value={datos.mapaTitulo ?? ""} onChange={(e) => setCampo("mapaTitulo", e.target.value)} placeholder="¿Dónde estamos?" /></label>
          <label className="form-field form-field-full"><span>Subtítulo (dirección, sede, horarios…)</span><input type="text" value={datos.mapaSubtitulo ?? ""} onChange={(e) => setCampo("mapaSubtitulo", e.target.value)} placeholder="Azul, Provincia de Buenos Aires · Lunes a viernes de 8:00 a 12:00…" /></label>
          <label className="form-field form-field-full"><span>Mapa (pegá el iframe completo de Google Maps o solo la URL)</span><input type="text" inputMode="url" value={datos.mapaUrl ?? ""} onChange={(e) => setCampo("mapaUrl", extraerUrlIframe(e.target.value))} placeholder="https://www.google.com/maps/embed?pb=... o <iframe src=&quot;...&quot;>" /></label>
          <small className="form-hint">
            En Google Maps: buscá la dirección → Compartir → Insertar un mapa → copiá el código y pegalo en el campo &quot;Mapa&quot;. Si lo dejás vacío, el bloque no se muestra en la portada. El botón &quot;Cómo llegar&quot; usa la dirección del bloque Contacto.
          </small>
        </fieldset>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="btn-primary btn-sm" disabled={enviando}>{enviando ? "Guardando…" : "Guardar configuración"}</button>
          <a href="/panel" className="btn-ghost-dark" onClick={(e) => { e.preventDefault(); router.push("/panel"); }}>Cancelar</a>
        </div>
      </form>
    </div>
  );
}
