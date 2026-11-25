import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NoticiasList from "@/components/NoticiasList";
import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, NOMBRE_SITIO, urlSitio } from "@/lib/meta";
import { prisma } from "@/lib/prisma";
import { NOTICIA_SELECT } from "@/lib/noticiaAdmin";
import type { Noticia } from "@/lib/noticiaUtils";

export const dynamic = "force-dynamic";

const POR_PAGINA = 12;

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

export default async function NoticiasPage() {
  let noticias: Noticia[] | undefined;
  let total = 0;

  try {
    const [noticiasDb, count] = await Promise.all([
      prisma.noticia.findMany({
        where: { activo: true, borrador: false },
        select: NOTICIA_SELECT,
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
        take: POR_PAGINA,
      }),
      prisma.noticia.count({ where: { activo: true, borrador: false } }),
    ]);

    noticias = noticiasDb.map((n) => ({
      ...n,
      fecha: n.fecha.toISOString(),
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));
    total = count;
  } catch {
    // Si la base no está disponible en este momento
  }

  return (
    <>
      <SiteHeader active="noticias" />

      <main id="contenido" tabIndex={-1}>
        <div className="page-header">
          <div className="wrap">
            <h1>Noticias y Novedades</h1>
            <p>
              Mantenete al tanto de convocatorias, aperturas de inscripciones y
              actividades institucionales.
            </p>
          </div>
        </div>

        <NoticiasList noticiasIniciales={noticias} totalInicial={total} />
      </main>

      <SiteFooter />
    </>
  );
}
