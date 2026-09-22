import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CourseCatalog from "@/components/CourseCatalog";

export default function CursosPage() {
  const anio = new Date().getFullYear();

  return (
    <>
      <SiteHeader active="cursos" />

      <div className="page-header" id="contenido" tabIndex={-1}>
        <div className="wrap">
          <h1>Oferta Educativa {anio}</h1>
          <p>
            Formación profesional gratuita y de calidad. Consultá la nómina de
            capacitaciones e iniciá tu formación con validez oficial.
          </p>
        </div>
      </div>

      <CourseCatalog />

      <SiteFooter />
    </>
  );
}