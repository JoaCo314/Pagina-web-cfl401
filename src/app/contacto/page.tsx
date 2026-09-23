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
      <main className="wrap" style={{ padding: "32px 0" }}>
        <h1>{config?.contactoTitulo ?? "Contacto"}</h1>
        <p className="panel-lead">{config?.contactoSubtitulo ?? "Escribinos y te respondemos a la brevedad."}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 32, marginTop: 24 }}>
          <div>
            <ul className="info-list">
              <li><strong>Dirección:</strong> {config?.contactoDireccion ?? "Azul, Provincia de Buenos Aires"}</li>
              <li><strong>Tel:</strong> {config?.contactoTelefono ?? "+54 2281 32-3444"}</li>
              <li><strong>Email:</strong> {config?.contactoEmail ?? "cfl401azul@gmail.com"}</li>
              <li><strong>Horarios:</strong> {config?.contactoHorarios ?? "Lunes a viernes de 8:00 a 12:00 y de 14:00 a 22:00"}</li>
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
