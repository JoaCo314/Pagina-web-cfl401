"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteConfigData } from "@/lib/siteConfig";

type ContactoDatos = {
  contactoTitulo: string;
  contactoSubtitulo: string;
  contactoEmail: string;
  contactoTelefono: string;
  contactoDireccion: string;
  contactoHorarios: string;
  contactoFormDestinatario: string;
};

export default function ContactoForm({
  inicial,
}: {
  inicial: Pick<SiteConfigData, "contactoTitulo" | "contactoSubtitulo" | "contactoEmail" | "contactoTelefono" | "contactoDireccion" | "contactoHorarios" | "contactoFormDestinatario">;
}) {
  const router = useRouter();
  const [datos, setDatos] = useState<ContactoDatos>({
    contactoTitulo: inicial.contactoTitulo ?? "",
    contactoSubtitulo: inicial.contactoSubtitulo ?? "",
    contactoEmail: inicial.contactoEmail ?? "",
    contactoTelefono: inicial.contactoTelefono ?? "",
    contactoDireccion: inicial.contactoDireccion ?? "",
    contactoHorarios: inicial.contactoHorarios ?? "",
    contactoFormDestinatario: inicial.contactoFormDestinatario ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function setCampo<K extends keyof ContactoDatos>(key: K, val: string) {
    setDatos((prev) => ({ ...prev, [key]: val }));
    setGuardado(false);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
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
      {guardado && (
        <p className="form-ok">
          Guardado correctamente. Los cambios ya están visibles en el sitio
          público.
        </p>
      )}
      <form className="guia-form" onSubmit={onSubmit} noValidate>
        <fieldset className="guia-bloque">
          <legend>Datos de la sección Contacto (/contacto)</legend>
          <label className="form-field"><span>Título</span><input type="text" value={datos.contactoTitulo} onChange={(e) => setCampo("contactoTitulo", e.target.value)} placeholder="Contacto" /></label>
          <label className="form-field"><span>Subtítulo</span><input type="text" value={datos.contactoSubtitulo} onChange={(e) => setCampo("contactoSubtitulo", e.target.value)} placeholder="Escribinos y te respondemos a la brevedad." /></label>
          <label className="form-field"><span>Email</span><input type="text" inputMode="email" value={datos.contactoEmail} onChange={(e) => setCampo("contactoEmail", e.target.value)} placeholder="cfl401azul@gmail.com" /></label>
          <label className="form-field"><span>Teléfono</span><input type="text" value={datos.contactoTelefono} onChange={(e) => setCampo("contactoTelefono", e.target.value)} /></label>
          <label className="form-field"><span>Dirección</span><input type="text" value={datos.contactoDireccion} onChange={(e) => setCampo("contactoDireccion", e.target.value)} /></label>
          <label className="form-field"><span>Horarios</span><input type="text" value={datos.contactoHorarios} onChange={(e) => setCampo("contactoHorarios", e.target.value)} /></label>
          <label className="form-field"><span>Email destinatario del formulario</span><input type="text" inputMode="email" value={datos.contactoFormDestinatario} onChange={(e) => setCampo("contactoFormDestinatario", e.target.value)} /></label>
        </fieldset>

        <small className="form-hint">
          La dirección del bloque Contacto también se usa como destino del
          botón &quot;Cómo llegar&quot; del mapa en la portada.
        </small>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="btn-primary btn-sm" disabled={enviando}>{enviando ? "Guardando…" : "Guardar contacto"}</button>
          <a href="/panel" className="btn-ghost-dark" onClick={(e) => { e.preventDefault(); router.push("/panel"); }}>Cancelar</a>
        </div>
      </form>
    </div>
  );
}