import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CourseCatalog, { type Categoria, type Curso } from "@/components/CourseCatalog";
import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, NOMBRE_SITIO, urlSitio } from "@/lib/meta";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export default async function CursosPage() {
  const anio = new Date().getFullYear();

  let categorias: Categoria[] | undefined;
  try {
    const cursos = await prisma.curso.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        categoria: { select: { id: true, nombre: true } },
        emoji: true,
        cupos: true,
        modalidad: true,
        horarios: true,
        mesesCursada: true,
        fechaInicio: true,
        sede: true,
        imagenUrl: true,
        docentes: {
          include: {
            docente: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
      orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
    });

    const grupos = new Map<string, Curso[]>();
    for (const curso of cursos) {
      const clave = curso.categoria?.nombre ?? "Sin categoría";
      const lista = grupos.get(clave) ?? [];
      lista.push({
        ...curso,
        fechaInicio: curso.fechaInicio?.toISOString() ?? null,
      });
      grupos.set(clave, lista);
    }

    categorias = Array.from(grupos.entries()).map(
      ([nombre, cursosDeCategoria]) => ({
        categoria: nombre,
        cursos: cursosDeCategoria,
      })
    );
  } catch {
    // Si la base no está disponible en este momento
  }

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

        <CourseCatalog categoriasIniciales={categorias} />
      </main>

      <SiteFooter />
    </>
  );
}