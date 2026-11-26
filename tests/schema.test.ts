import test from "node:test";
import assert from "node:assert/strict";
import {
  limpiarTextoParaSchema,
  generarEsquemaOrganizacion,
  generarEsquemaCurso,
  generarEsquemaFaq,
  generarEsquemaNoticia,
  INSTITUCION_DATOS,
} from "../src/lib/schema";

test("limpiarTextoParaSchema: limpia etiquetas HTML, entidades y espacios duplicados", () => {
  const html = "<p>Hola &nbsp; <strong>mundo</strong> &amp; amigos!</p>";
  const resultado = limpiarTextoParaSchema(html);
  assert.equal(resultado, "Hola mundo & amigos!");
  assert.equal(limpiarTextoParaSchema(null), "");
  assert.equal(limpiarTextoParaSchema(undefined), "");
});

test("generarEsquemaOrganizacion: genera EducationalOrganization con todos los datos requeridos", () => {
  const envAnterior = process.env.INSTAGRAM_URL;
  try {
    delete process.env.INSTAGRAM_URL;
    delete process.env.NEXT_PUBLIC_INSTAGRAM_URL;

    const esquemaSinIg = generarEsquemaOrganizacion();
    assert.equal(esquemaSinIg["@context"], "https://schema.org");
    assert.equal(esquemaSinIg["@type"], "EducationalOrganization");
    assert.equal(esquemaSinIg.name, "Centro de Formación Laboral N° 401 de Azul");
    assert.equal(esquemaSinIg.alternateName, "CFL 401 Azul");
    assert.ok(typeof esquemaSinIg.url === "string");
    assert.ok(typeof esquemaSinIg.logo === "string");
    assert.ok((esquemaSinIg.logo as string).endsWith("/cfl401azul_logo.jpg"));
    assert.equal(esquemaSinIg.telephone, "+54 2281 32-3444");

    const direccion = esquemaSinIg.address as Record<string, string>;
    assert.equal(direccion["@type"], "PostalAddress");
    assert.equal(direccion.streetAddress, "San Martín 1240");
    assert.equal(direccion.addressLocality, "Azul");
    assert.equal(direccion.addressRegion, "Provincia de Buenos Aires");
    assert.equal(direccion.addressCountry, "AR");
    assert.equal(esquemaSinIg.sameAs, undefined);

    process.env.INSTAGRAM_URL = "https://www.instagram.com/cfl401azul";
    const esquemaConIg = generarEsquemaOrganizacion();
    assert.deepEqual(esquemaConIg.sameAs, ["https://www.instagram.com/cfl401azul"]);
  } finally {
    if (envAnterior !== undefined) {
      process.env.INSTAGRAM_URL = envAnterior;
    } else {
      delete process.env.INSTAGRAM_URL;
    }
  }
});

test("generarEsquemaCurso: genera Course con gratuidad, oferta y modalidad presencial (onsite)", () => {
  const fechaInicio = new Date("2026-03-15T00:00:00Z");
  const fechaFin = new Date("2026-11-30T00:00:00Z");

  const esquema = generarEsquemaCurso({
    id: 10,
    nombre: "Electricidad de Inmuebles",
    descripcion: "<p>Instalaciones eléctricas <strong>domiciliarias</strong>.</p>",
    horarios: "Lunes y Miércoles de 18:00 a 21:00 hs",
    sede: "Anexo Barrio del Carmen",
    fechaInicio,
    fechaFin,
    imagenUrl: "/imagenes/electricidad.jpg",
  });

  assert.equal(esquema["@context"], "https://schema.org");
  assert.equal(esquema["@type"], "Course");
  assert.equal(esquema.name, "Electricidad de Inmuebles");
  assert.equal(esquema.description, "Instalaciones eléctricas domiciliarias.");
  assert.equal(esquema.isAccessibleForFree, true);

  const provider = esquema.provider as Record<string, string>;
  assert.equal(provider["@type"], "EducationalOrganization");
  assert.equal(provider.name, INSTITUCION_DATOS.nombre);

  const offers = esquema.offers as Record<string, unknown>;
  assert.equal(offers["@type"], "Offer");
  assert.equal(offers.price, "0");
  assert.equal(offers.priceCurrency, "ARS");
  assert.equal(offers.category, "Free");

  const instancias = esquema.hasCourseInstance as Array<Record<string, unknown>>;
  assert.ok(Array.isArray(instancias) && instancias.length === 1);
  const instancia = instancias[0];
  assert.equal(instancia["@type"], "CourseInstance");
  assert.equal(instancia.courseMode, "onsite");
  assert.equal(instancia.courseWorkload, "Lunes y Miércoles de 18:00 a 21:00 hs");
  assert.equal(instancia.startDate, "2026-03-15");
  assert.equal(instancia.endDate, "2026-11-30");

  const lugar = instancia.location as Record<string, unknown>;
  assert.equal(lugar["@type"], "Place");
  assert.equal(lugar.name, "Anexo Barrio del Carmen");
  const direccion = lugar.address as Record<string, string>;
  assert.equal(direccion["@type"], "PostalAddress");
  assert.equal(direccion.streetAddress, "San Martín 1240");
});

test("generarEsquemaFaq: mapea preguntas y respuestas limpias en formato FAQPage", () => {
  const faqData = [
    {
      pregunta: "¿Los cursos tienen costo?",
      respuesta: "No, son 100% gratuitos y oficiales.",
      respuestaHtml: null,
    },
    {
      pregunta: "¿Qué documentación debo presentar?",
      respuesta: null,
      respuestaHtml: "<p>DNI y certificado de <em>estudios</em> primarios o secundarios.</p>",
    },
  ];

  const esquema = generarEsquemaFaq(faqData);
  assert.equal(esquema["@context"], "https://schema.org");
  assert.equal(esquema["@type"], "FAQPage");

  const entidades = esquema.mainEntity as Array<Record<string, unknown>>;
  assert.equal(entidades.length, 2);

  assert.equal(entidades[0]["@type"], "Question");
  assert.equal(entidades[0].name, "¿Los cursos tienen costo?");
  assert.deepEqual(entidades[0].acceptedAnswer, {
    "@type": "Answer",
    text: "No, son 100% gratuitos y oficiales.",
  });

  assert.equal(entidades[1]["@type"], "Question");
  assert.equal(entidades[1].name, "¿Qué documentación debo presentar?");
  assert.deepEqual(entidades[1].acceptedAnswer, {
    "@type": "Answer",
    text: "DNI y certificado de estudios primarios o secundarios.",
  });
});

test("generarEsquemaNoticia: genera NewsArticle con fechas, titular, imagen y publisher", () => {
  const fechaPublicacion = new Date("2026-05-10T14:30:00Z");
  const fechaModificacion = new Date("2026-05-11T09:00:00Z");

  const esquema = generarEsquemaNoticia({
    id: 5,
    titulo: "Apertura de inscripciones segundo cuatrimestre",
    resumen: "Conocé los cursos con vacantes disponibles.",
    contenido: "Texto largo de la noticia con detalles...",
    fecha: fechaPublicacion,
    updatedAt: fechaModificacion,
    imagenUrl: "/noticias/inscripciones.png",
  });

  assert.equal(esquema["@context"], "https://schema.org");
  assert.equal(esquema["@type"], "NewsArticle");
  assert.equal(esquema.headline, "Apertura de inscripciones segundo cuatrimestre");
  assert.equal(esquema.description, "Conocé los cursos con vacantes disponibles.");
  assert.equal(esquema.datePublished, fechaPublicacion.toISOString());
  assert.equal(esquema.dateModified, fechaModificacion.toISOString());

  const imagenes = esquema.image as string[];
  assert.ok(Array.isArray(imagenes) && imagenes[0].endsWith("/noticias/inscripciones.png"));

  const publisher = esquema.publisher as Record<string, unknown>;
  assert.equal(publisher["@type"], "EducationalOrganization");
  assert.equal(publisher.name, INSTITUCION_DATOS.nombre);
  const logo = publisher.logo as Record<string, string>;
  assert.equal(logo["@type"], "ImageObject");
  assert.ok(logo.url.endsWith("/cfl401azul_logo.jpg"));
});
