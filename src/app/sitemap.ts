// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { urlSitio } from "@/lib/meta";

export const dynamic = "force-dynamic";

/// Mapa del sitio: páginas estáticas + las dinámicas (cursos y noticias
/// publicadas) para que los buscadores encuentren cada ficha sin depender solo
/// de los enlaces. Si la base no responde, se publican las estáticas igual.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = urlSitio();

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cursos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/noticias`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${base}/preguntas-frecuentes`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/sobre-el-centro`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    { url: `${base}/contacto`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const [cursos, noticias] = await Promise.all([
      prisma.curso.findMany({
        where: { activo: true },
        select: { id: true, updatedAt: true },
      }),
      prisma.noticia.findMany({
        where: { activo: true, borrador: false },
        select: { id: true, updatedAt: true },
      }),
    ]);

    const cursosDinamicos: MetadataRoute.Sitemap = cursos.map((curso) => ({
      url: `${base}/cursos/${curso.id}`,
      lastModified: curso.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const noticiasDinamicas: MetadataRoute.Sitemap = noticias.map((noticia) => ({
      url: `${base}/noticias/${noticia.id}`,
      lastModified: noticia.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...estaticas, ...cursosDinamicos, ...noticiasDinamicas];
  } catch (err) {
    console.error("[Sitemap] No se pudo consultar la base:", err);
    return estaticas;
  }
}