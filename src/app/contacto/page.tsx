import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContactoForm from "@/components/ContactoForm";
import { getSiteConfig } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

// Creado por sofia-athos - Página /contacto funcional y editable desde panel/configuracion
export default async function ContactoPage() {
  const config = await getSiteConfig().catch(() => null);
  return (
    <>
      <SiteHeader active="contacto" />
      <div className="page-header" id="contenido" tabIndex={-1}>
        <div className="wrap">
          <h1>{config?.contactoTitulo ?? ""}</h1>
          {config?.contactoSubtitulo ? <p>{config.contactoSubtitulo}</p> : null}
        </div>
      </div>
      <main className="wrap" style={{ padding: "32px 0" }}>
        <div className="contacto-grid">
          <div>
            <ul className="info-list">
              {config?.contactoDireccion ? (
                <li><strong>Dirección:</strong> {config.contactoDireccion}</li>
              ) : null}
              {config?.contactoTelefono ? (
                <li><strong>Tel:</strong> {config.contactoTelefono}</li>
              ) : null}
              {config?.contactoEmail ? (
                <li><strong>Email:</strong> {config.contactoEmail}</li>
              ) : null}
              {config?.contactoHorarios ? (
                <li><strong>Horarios:</strong> {config.contactoHorarios}</li>
              ) : null}
            </ul>
          </div>
          <div>
            <ContactoForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
