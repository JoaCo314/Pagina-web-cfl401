import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CourseCatalog from "@/components/CourseCatalog";
import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, NOMBRE_SITIO, urlSitio } from "@/lib/meta";

export function generateMetadata(): Metadata {
  const anio = new Date().getFullYear();
  const title = `Oferta Educativa ${anio}`;
  const description =
    "Formación profesional gratuita y con validez oficial en Azul: consultá la nómina de capacitaciones del CFL 401.";

  return {
    title,
    description,
    alternates: {
      canonical: "/cursos",
    },
    openGraph: {
      title,
      description,
      url: `${urlSitio()}/cursos`,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${title} — ${NOMBRE_SITIO}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default function CursosPage() {
  const anio = new Date().getFullYear();

  return (
    <>
      <SiteHeader active="cursos" />

      <main id="contenido" tabIndex={-1}>
        <div className="page-header">
          <div className="wrap">
            <h1>Oferta Educativa {anio}</h1>
            <p>
              Formación profesional gratuita y de calidad. Consultá la nómina de
              capacitaciones e iniciá tu formación con validez oficial.
            </p>
          </div>
        </div>

        <CourseCatalog />
      </main>

      <SiteFooter />
    </>
  );
}