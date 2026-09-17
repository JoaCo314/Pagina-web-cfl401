import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashSync } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Contraseñas reales de los usuarios de prueba (solo para desarrollo).
// Se hashean con bcrypt en el propio seed; en producción se crean vía el panel.
const PASSWORDS: Record<string, string> = {
  "admin@cfl401.edu.ar": "Admin123!",
  "preceptor@cfl401.edu.ar": "Preceptor123!",
  "docente1@cfl401.edu.ar": "Docente123!",
  "docente2@cfl401.edu.ar": "Docente123!",
};

type CursoData = {
  nombre: string;
  descripcion?: string;
  modalidad?: string;
  horarios?: string;
  mesesCursada?: string;
  fechaInicio?: Date;
  programaContenidos?: string;
  categoria?: string;
  cupos?: number;
  imagenUrl?: string;
  informacionAdicional?: string;
  activo?: boolean;
};

async function upsertCurso(data: CursoData) {
  const existing = await prisma.curso.findFirst({ where: { nombre: data.nombre } });
  if (existing) {
    return prisma.curso.update({ where: { id: existing.id }, data });
  }
  return prisma.curso.create({ data });
}

type NoticiaData = {
  titulo: string;
  resumen?: string;
  contenido: string;
  fecha: Date;
  imagenUrl?: string;
  activo?: boolean;
};

async function upsertNoticia(data: NoticiaData) {
  const existing = await prisma.noticia.findFirst({
    where: { titulo: data.titulo },
  });
  if (existing) {
    return prisma.noticia.update({ where: { id: existing.id }, data });
  }
  return prisma.noticia.create({ data });
}

async function main() {
  const roles = [
    {
      nombre: "Administrador",
      nivel: 3,
      descripcion: "Gestión integral del sistema: usuarios, cursos y configuración.",
    },
    {
      nombre: "Preceptor",
      nivel: 2,
      descripcion: "Preceptoría: administración de cursadas y seguimiento de docentes y cursos.",
    },
    {
      nombre: "Docente",
      nivel: 1,
      descripcion: "Dictado de clases y gestión de los cursos asignados.",
    },
  ];

  const roleIds: Record<string, number> = {};
  for (const rol of roles) {
    const saved = await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: { nivel: rol.nivel, descripcion: rol.descripcion },
      create: rol,
    });
    roleIds[rol.nombre] = saved.id;
  }

  // Los usuarios de prueba usan contraseñas reales hasheadas con bcrypt (constante PASSWORDS).
  const usuarios = [
    {
      nombre: "María",
      apellido: "González",
      email: "admin@cfl401.edu.ar",
      rol: "Administrador",
    },
    {
      nombre: "Juan",
      apellido: "Pérez",
      email: "preceptor@cfl401.edu.ar",
      rol: "Preceptor",
    },
    {
      nombre: "Lucía",
      apellido: "Fernández",
      email: "docente1@cfl401.edu.ar",
      rol: "Docente",
    },
    {
      nombre: "Carlos",
      apellido: "Rodríguez",
      email: "docente2@cfl401.edu.ar",
      rol: "Docente",
    },
  ];

  const userIds: Record<string, number> = {};
  for (const u of usuarios) {
    const saved = await prisma.usuario.upsert({
      where: { email: u.email },
      update: {
        nombre: u.nombre,
        apellido: u.apellido,
        rolId: roleIds[u.rol],
        passwordHash: hashSync(PASSWORDS[u.email] ?? "Cambiar-123!", 10),
      },
      create: {
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        passwordHash: hashSync(PASSWORDS[u.email] ?? "Cambiar-123!", 10),
        activo: true,
        rolId: roleIds[u.rol],
      },
    });
    userIds[u.email] = saved.id;
  }

  const cursos: Array<CursoData & { docentes: string[] }> = [
    {
      nombre: "Reparación y Mantenimiento de PC",
      descripcion: "Aprendé a diagnosticar y reparar computadoras de escritorio y notebooks.",
      categoria: "Informática",
      modalidad: "Presencial",
      horarios: "Lunes y miércoles de 18 a 21 hs. (C2)",
      mesesCursada: "4 meses",
      fechaInicio: new Date("2026-03-02T00:00:00Z"),
      programaContenidos:
        "Hardware, diagnóstico de fallas, armado y mantenimiento general de equipos.",
      informacionAdicional: "Cupos limitados a 15 estudiantes.",
      cupos: 15,
      activo: true,
      docentes: ["docente1@cfl401.edu.ar", "docente2@cfl401.edu.ar"],
    },
    {
      nombre: "Auxiliar de Cocina",
      descripcion: "Formación básica para trabajar en cocinas gastronómicas.",
      categoria: "Gastronomía",
      modalidad: "Presencial",
      horarios: "Martes y jueves de 14 a 17 hs. (C1)",
      mesesCursada: "6 meses",
      fechaInicio: new Date("2026-03-05T00:00:00Z"),
      programaContenidos:
        "Técnicas básicas de cocina, higiene y seguridad alimentaria, y manipulación de alimentos.",
      cupos: 12,
      activo: true,
      docentes: ["docente1@cfl401.edu.ar"],
    },
    {
      nombre: "Electricidad Domiciliaria Básica",
      descripcion: "Instalaciones eléctricas seguras para el hogar.",
      categoria: "Oficios",
      modalidad: "Presencial",
      horarios: "Sábados de 9 a 13 hs. (Taller)",
      mesesCursada: "5 meses",
      fechaInicio: new Date("2026-04-04T00:00:00Z"),
      programaContenidos:
        "Instalaciones eléctricas domiciliarias, seguridad, y normativa vigente (IRAM).",
      cupos: 10,
      activo: true,
      docentes: ["docente2@cfl401.edu.ar"],
    },
    {
      nombre: "Auxiliar Administrativo Contable",
      descripcion: "Inserción laboral en tareas administrativas y contables.",
      categoria: "Administración",
      modalidad: "Presencial",
      horarios: "Lunes a viernes de 9 a 12 hs. (Aula 3)",
      mesesCursada: "8 meses",
      fechaInicio: new Date("2026-03-10T00:00:00Z"),
      programaContenidos:
        "Liquidación de sueldos, facturación, atención al cliente y herramientas informáticas.",
      cupos: 20,
      activo: true,
      docentes: ["docente2@cfl401.edu.ar"],
    },
  ];

  for (const curso of cursos) {
    const { docentes, ...data } = curso;

    const saved = await upsertCurso(data);

    await prisma.cursoDocente.deleteMany({ where: { cursoId: saved.id } });

    const docentesExistentes = docentes
      .map((email) => userIds[email])
      .filter((id): id is number => id !== undefined);

    await prisma.cursoDocente.createMany({
      data: docentesExistentes.map((docenteId) => ({
        cursoId: saved.id,
        docenteId,
      })),
      skipDuplicates: true,
    });

    console.log(`Curso listo: "${saved.nombre}" (${docentes.length} docente(s))`);
  }

  const noticias: NoticiaData[] = [
    {
      titulo: "Ya está abierta la preinscripción a los cursos 2026",
      resumen:
        "Conocé la documentación necesaria y los pasos online para asegurar tu cupo en la oferta del segundo cuatrimestre.",
      contenido: `La preinscripción a la oferta educativa 2026 ya se encuentra abierta en todas las sedes del CFL 401.

Para anotarte, elegí la capacitación que te interesa en la sección de Oferta Educativa y completá el formulario de preinscripción con tus datos personales.

Luego presentá la documentación requerida en la sede dentro de los plazos indicados. La inscripción es gratuita y abierta a toda la comunidad.`,
      fecha: new Date("2026-08-12T00:00:00Z"),
      activo: true,
    },
    {
      titulo: "Se busca instructor para el curso de Robótica y Automatización",
      resumen:
        "Llamado público para cobertura de horas cátedra en el trayecto formativo técnico de Robótica.",
      contenido: `El Centro de Formación Laboral 401 llama a interesados para cubrir horas cátedra del curso de Robótica y Automatización.

Requisitos: formación técnica afín y experiencia comprobable en el dictado de capacitaciones.

Los interesados deben enviar su currículum al correo institucional indicando el trayecto al que se postulan.`,
      fecha: new Date("2026-08-08T00:00:00Z"),
      activo: true,
    },
    {
      titulo: "Arrancó el proyecto de los alumnos para la Expo del CFL 401",
      resumen:
        "Estudiantes de los talleres de Madera y Electricidad colaboran en la estructura de la muestra colectiva anual.",
      contenido: `Con gran entusiasmo comenzó el proyecto conjunto de los talleres de Madera y Electricidad para la Expo anual del CFL 401.

Los estudiantes trabajan en el diseño y la construcción de la estructura de la muestra, guiados por sus docentes.

La exposición será abierta al público y contará con la presencia de la comunidad educativa.`,
      fecha: new Date("2026-08-03T00:00:00Z"),
      activo: true,
    },
    {
      titulo: "Entrega de certificados a egresados de Panadería",
      resumen:
        "En un cálido acto institucional se entregaron los certificados oficializados a más de 30 alumnos.",
      contenido: `Se realizó la entrega de certificados a los egresados del taller de Panadería, en un acto que reunió a alumnos, docentes y familias.

Más de 30 estudiantes completaron la formación y recibieron su certificación oficial.

Felicitamos a todos los egresados y los invitamos a continuar su formación en los nuevos trayectos del centro.`,
      fecha: new Date("2026-07-20T00:00:00Z"),
      activo: true,
    },
  ];

  for (const noticia of noticias) {
    const saved = await upsertNoticia(noticia);
    console.log(`Noticia lista: "${saved.titulo}"`);
  }

  const totalUsuarios = await prisma.usuario.count();
  const totalCursos = await prisma.curso.count();
  const totalAsignaciones = await prisma.cursoDocente.count();
  const totalNoticias = await prisma.noticia.count();

  const contenidosGuia = [
    {
      clave: "pasos",
      titulo: "Pasos para inscribirte",
      contenido: `1. Elegí la capacitación que te interesa en la sección de Oferta Educativa.
2. Completá el formulario de preinscripción con tus datos personales.
3. Presentá la documentación requerida en la sede del CFL 401 dentro de los plazos indicados.
4. Esperá la confirmación de tu vacante por correo electrónico o vía telefónica.`,
      orden: 1,
    },
    {
      clave: "documentacion",
      titulo: "Documentación requerida",
      contenido: `• Documento Nacional de Identidad (DNI) en curso de vigencia.
• Certificado de estudios último nivel cursado (alumnos nuevos) o libreta de calificaciones (alumnos regulares).
• Fotocopia del DNI (frente y dorso).
• Foto carnet 4×4 reciente (fondo blanco).
• Comprobante de domicilio actualizado.`,
      orden: 2,
    },
    {
      clave: "requisitos",
      titulo: "Requisitos",
      contenido: `• Ser mayor de 18 años o contar con autorización del padre/madre/tutor.
• Residir en la jurisdicción del CFL 401 o zona de cobertura.
• Presentar la documentación completa dentro del período de inscripción.
• Cumplir con los requisitos específicos de la capacitación elegida, de existir.`,
      orden: 3,
    },
    {
      clave: "informacion_adicional",
      titulo: "Información adicional",
      contenido: `• Todas las capacitaciones son gratuitas y de carácter público.
• Los horarios varían según la cursada; consultá la ficha de cada curso.
• La sede principal del CFL 401 se encuentra en [dirección a completar].
• Para consultas podés comunicarte al teléfono [teléfono] o escribirnos por correo electrónico.`,
      orden: 4,
    },
  ];

  for (const c of contenidosGuia) {
    await prisma.contenidoGuia.upsert({
      where: { clave: c.clave },
      update: { titulo: c.titulo, contenido: c.contenido, orden: c.orden },
      create: c,
    });
  }

  const totalContenidosGuia = await prisma.contenidoGuia.count();

  console.log("---");
  console.log(`Seed completado: ${totalUsuarios} usuarios, ${totalCursos} cursos, ${totalAsignaciones} asignaciones, ${totalContenidosGuia} contenidos de guía, ${totalNoticias} noticias.`);
}

main()
  .catch((err) => {
    console.error("Error ejecutando el seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });