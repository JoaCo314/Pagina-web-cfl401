import { DEFAULT_OG_IMAGE, urlSitio } from "@/lib/meta";

export const INSTITUCION_DATOS = {
  nombre: "Centro de Formación Laboral N° 401 de Azul",
  alternateName: "CFL 401 Azul",
  telefono: "+54 2281 32-3444",
  direccion: {
    calle: "San Martín 1240",
    localidad: "Azul",
    provincia: "Provincia de Buenos Aires",
    pais: "AR",
  },
  logoRuta: "/cfl401azul_logo.jpg",
} as const;

/**
 * Remueve etiquetas HTML y normaliza espacios para generar texto plano
 * apto para descripciones y respuestas en JSON-LD.
 */
export function limpiarTextoParaSchema(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Obtiene la URL de Instagram configurada en variables de entorno, si existe.
 */
export function obtenerInstagramUrl(): string | undefined {
  const configurada =
    process.env.INSTAGRAM_URL?.trim() ||
    process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim();
  return configurada || undefined;
}

/**
 * Genera el esquema institucional `EducationalOrganization` de Schema.org.
 */
export function generarEsquemaOrganizacion(): Record<string, unknown> {
  const base = urlSitio();
  const instagram = obtenerInstagramUrl();

  const esquema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: INSTITUCION_DATOS.nombre,
    alternateName: INSTITUCION_DATOS.alternateName,
    url: base,
    logo: `${base}${INSTITUCION_DATOS.logoRuta}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: INSTITUCION_DATOS.direccion.calle,
      addressLocality: INSTITUCION_DATOS.direccion.localidad,
      addressRegion: INSTITUCION_DATOS.direccion.provincia,
      addressCountry: INSTITUCION_DATOS.direccion.pais,
    },
    telephone: INSTITUCION_DATOS.telefono,
  };

  if (instagram) {
    esquema.sameAs = [instagram];
  }

  return esquema;
}

export type CursoParaSchema = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  horarios?: string | null;
  sede?: string | null;
  modalidad?: string | null;
  fechaInicio?: Date | string | null;
  fechaFin?: Date | string | null;
  imagenUrl?: string | null;
};

/**
 * Genera el esquema `Course` de Schema.org para un curso individual.
 */
export function generarEsquemaCurso(curso: CursoParaSchema): Record<string, unknown> {
  const base = urlSitio();
  const urlCurso = `${base}/cursos/${curso.id}`;

  const descripcionLimpia = curso.descripcion?.trim()
    ? limpiarTextoParaSchema(curso.descripcion)
    : `Curso de ${curso.nombre} dictado de forma gratuita y presencial en el ${INSTITUCION_DATOS.nombre}.`;

  const imagen = curso.imagenUrl
    ? (curso.imagenUrl.startsWith("http") ? curso.imagenUrl : `${base}${curso.imagenUrl}`)
    : `${base}${DEFAULT_OG_IMAGE}`;

  const fechaInicioIso = curso.fechaInicio
    ? (curso.fechaInicio instanceof Date
        ? curso.fechaInicio.toISOString().split("T")[0]
        : String(curso.fechaInicio).split("T")[0])
    : undefined;

  const fechaFinIso = curso.fechaFin
    ? (curso.fechaFin instanceof Date
        ? curso.fechaFin.toISOString().split("T")[0]
        : String(curso.fechaFin).split("T")[0])
    : undefined;

  const instancia: Record<string, unknown> = {
    "@type": "CourseInstance",
    courseMode: "onsite",
    location: {
      "@type": "Place",
      name: curso.sede?.trim() || INSTITUCION_DATOS.nombre,
      address: {
        "@type": "PostalAddress",
        streetAddress: INSTITUCION_DATOS.direccion.calle,
        addressLocality: INSTITUCION_DATOS.direccion.localidad,
        addressRegion: INSTITUCION_DATOS.direccion.provincia,
        addressCountry: INSTITUCION_DATOS.direccion.pais,
      },
    },
  };

  if (curso.horarios?.trim()) {
    instancia.courseWorkload = curso.horarios.trim();
    instancia.courseSchedule = {
      "@type": "Schedule",
      repeatFrequency: curso.horarios.trim(),
    };
  }

  if (fechaInicioIso) {
    instancia.startDate = fechaInicioIso;
  }
  if (fechaFinIso) {
    instancia.endDate = fechaFinIso;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: curso.nombre,
    description: descripcionLimpia,
    url: urlCurso,
    image: imagen,
    provider: {
      "@type": "EducationalOrganization",
      name: INSTITUCION_DATOS.nombre,
      alternateName: INSTITUCION_DATOS.alternateName,
      url: base,
    },
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ARS",
      category: "Free",
      availability: "https://schema.org/InStock",
      url: urlCurso,
    },
    hasCourseInstance: [instancia],
  };
}

export type PreguntaParaSchema = {
  pregunta: string;
  respuesta?: string | null;
  respuestaHtml?: string | null;
};

/**
 * Genera el esquema `FAQPage` de Schema.org a partir de un listado de preguntas frecuentes.
 */
export function generarEsquemaFaq(preguntas: PreguntaParaSchema[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((item) => {
      const respuestaTexto =
        (item.respuesta && item.respuesta.trim()) ||
        limpiarTextoParaSchema(item.respuestaHtml);

      return {
        "@type": "Question",
        name: item.pregunta.trim(),
        acceptedAnswer: {
          "@type": "Answer",
          text: respuestaTexto,
        },
      };
    }),
  };
}

export type NoticiaParaSchema = {
  id: number;
  titulo: string;
  resumen?: string | null;
  contenido: string;
  contenidoHtml?: string | null;
  fecha?: Date | string | null;
  imagenUrl?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

/**
 * Genera el esquema `NewsArticle` de Schema.org para una noticia publicada.
 */
export function generarEsquemaNoticia(noticia: NoticiaParaSchema): Record<string, unknown> {
  const base = urlSitio();
  const urlNoticia = `${base}/noticias/${noticia.id}`;

  const descripcionLimpia =
    noticia.resumen?.trim() ||
    limpiarTextoParaSchema(noticia.contenido).slice(0, 200) ||
    noticia.titulo;

  const imagen = noticia.imagenUrl
    ? (noticia.imagenUrl.startsWith("http") ? noticia.imagenUrl : `${base}${noticia.imagenUrl}`)
    : `${base}${DEFAULT_OG_IMAGE}`;

  const fechaBase = noticia.fecha || noticia.createdAt || new Date();
  const fechaPublicacion =
    fechaBase instanceof Date ? fechaBase.toISOString() : new Date(fechaBase).toISOString();

  const fechaModificacionBase = noticia.updatedAt || noticia.fecha || noticia.createdAt || new Date();
  const fechaModificacion =
    fechaModificacionBase instanceof Date
      ? fechaModificacionBase.toISOString()
      : new Date(fechaModificacionBase).toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: noticia.titulo,
    description: descripcionLimpia,
    image: [imagen],
    datePublished: fechaPublicacion,
    dateModified: fechaModificacion,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": urlNoticia,
    },
    author: [
      {
        "@type": "Organization",
        name: INSTITUCION_DATOS.nombre,
        url: base,
      },
    ],
    publisher: {
      "@type": "EducationalOrganization",
      name: INSTITUCION_DATOS.nombre,
      alternateName: INSTITUCION_DATOS.alternateName,
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}${INSTITUCION_DATOS.logoRuta}`,
      },
    },
  };
}
