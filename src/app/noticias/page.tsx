import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticiasList from "@/components/NoticiasList";
import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, NOMBRE_SITIO, urlSitio } from "@/lib/meta";

const title = "Noticias y Novedades";
const description =
  "Convocatorias, aperturas de inscripciones y actividades institucionales del CFL 401 Azul.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/noticias",
  },
  openGraph: {
    title,
    description,
    url: `${urlSitio()}/noticias`,
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

export default function NoticiasPage() {
  return (
    <>
      <SiteHeader active="noticias" />

      <div className="page-header" id="contenido" tabIndex={-1}>
        <div className="wrap">
          <h1>Noticias y Novedades</h1>
          <p>
            Mantenete al tanto de convocatorias, aperturas de inscripciones y
            actividades institucionales.
          </p>
        </div>
      </div>

      <NoticiasList />

      <SiteFooter />
    </>
  );
}
