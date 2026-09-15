import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

  // Los passwords son placeholders: se reemplazarán por hashes bcrypt reales
  // cuando se implemente la autenticación (Tarea de login).
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
      update: { nombre: u.nombre, apellido: u.apellido, rolId: roleIds[u.rol] },
      create: {
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        passwordHash: "pendiente-bcrypt",
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

  const totalUsuarios = await prisma.usuario.count();
  const totalCursos = await prisma.curso.count();
  const totalAsignaciones = await prisma.cursoDocente.count();

  console.log("---");
  console.log(`Seed completado: ${totalUsuarios} usuarios, ${totalCursos} cursos, ${totalAsignaciones} asignaciones.`);
}

main()
  .catch((err) => {
    console.error("Error ejecutando el seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });