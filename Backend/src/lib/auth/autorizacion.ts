import type { UsuarioSesion } from "@/lib/auth/session";
import { ROLES } from "@/lib/auth/roles";

export const PERMISOS = {
  CURSOS_VER: "cursos:ver",
  CURSOS_CREAR: "cursos:crear",
  CURSOS_EDITAR: "cursos:editar",
  CURSOS_ELIMINAR: "cursos:eliminar",
  CURSOS_ASIGNAR_DOCENTES: "cursos:asignar_docentes",
  USUARIOS_VER: "usuarios:ver",
  USUARIOS_VER_TODOS: "usuarios:ver_todos",
  USUARIOS_CREAR: "usuarios:crear",
  USUARIOS_CREAR_ADMIN: "usuarios:crear_admin",
  USUARIOS_CREAR_PRECEPTOR: "usuarios:crear_preceptor",
  USUARIOS_CREAR_DOCENTE: "usuarios:crear_docente",
  USUARIOS_DESACTIVAR: "usuarios:desactivar",
  GUIA_EDITAR: "guia:editar",
  NOTICIAS_CREAR: "noticias:crear",
  NOTICIAS_EDITAR: "noticias:editar",
  NOTICIAS_ELIMINAR: "noticias:eliminar",
  SOBRE_EL_CENTRO_EDITAR: "sobre_el_centro:editar",
  PREGUNTAS_FAQS_EDITAR: "preguntas_faqs:editar",
} as const;

export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS];

/// Matriz de permisos según secciones 4, 5 y 12 del documento de requerimientos (RNF-04).
/// Reglas de creación de usuarios (RF-13/RF-14):
///   - Administrador: crea administradores, preceptores y docentes.
///   - Preceptor: crea SOLO docentes (no administradores ni preceptores).
/// Reglas de cursos (RF-11/RF-16):
///   - Docente: gestiona UNICAMENTE los cursos que le fueron asignados
///     (CursoDocente). No crea ni elimina cursos, no se asigna cursos,
///     ni opera sobre cursos de otros docentes. El acceso a sus cursos se
///     valida con `puedeGestionarCurso` controlando la asignación.
const PERMISOS_POR_ROL: Record<
  (typeof ROLES)[keyof typeof ROLES],
  readonly Permiso[]
> = {
  [ROLES.ADMINISTRADOR]: [
    PERMISOS.CURSOS_VER,
    PERMISOS.CURSOS_CREAR,
    PERMISOS.CURSOS_EDITAR,
    PERMISOS.CURSOS_ELIMINAR,
    PERMISOS.CURSOS_ASIGNAR_DOCENTES,
    PERMISOS.USUARIOS_VER,
    PERMISOS.USUARIOS_VER_TODOS,
    PERMISOS.USUARIOS_CREAR,
    PERMISOS.USUARIOS_CREAR_ADMIN,
    PERMISOS.USUARIOS_CREAR_PRECEPTOR,
    PERMISOS.USUARIOS_CREAR_DOCENTE,
    PERMISOS.USUARIOS_DESACTIVAR,
    PERMISOS.GUIA_EDITAR,
    PERMISOS.NOTICIAS_CREAR,
    PERMISOS.NOTICIAS_EDITAR,
    PERMISOS.NOTICIAS_ELIMINAR,
    PERMISOS.SOBRE_EL_CENTRO_EDITAR,
    PERMISOS.PREGUNTAS_FAQS_EDITAR,
  ],
  [ROLES.PRECEPTOR]: [
    PERMISOS.CURSOS_VER,
    PERMISOS.CURSOS_CREAR,
    PERMISOS.CURSOS_EDITAR,
    PERMISOS.CURSOS_ELIMINAR,
    PERMISOS.CURSOS_ASIGNAR_DOCENTES,
    PERMISOS.USUARIOS_VER,
    PERMISOS.USUARIOS_CREAR,
    PERMISOS.USUARIOS_CREAR_DOCENTE,
    PERMISOS.GUIA_EDITAR,
    PERMISOS.NOTICIAS_CREAR,
    PERMISOS.NOTICIAS_EDITAR,
    PERMISOS.NOTICIAS_ELIMINAR,
    PERMISOS.SOBRE_EL_CENTRO_EDITAR,
    PERMISOS.PREGUNTAS_FAQS_EDITAR,
  ],
  [ROLES.DOCENTE]: [PERMISOS.CURSOS_VER],
};

export function esRol(
  usuario: UsuarioSesion | null | undefined,
  rol: (typeof ROLES)[keyof typeof ROLES]
): boolean {
  return usuario?.rol?.nombre === rol;
}

/// Comprueba si el usuario autenticado tiene un permiso de la matriz (RNF-04).
/// Esta es la única fuente de verdad para decidir en el backend; el frontend
/// solo refleja lo que el servidor autoriza (no se confía en ocultar botones).
export function tienePermiso(
  usuario: UsuarioSesion | null | undefined,
  permiso: Permiso
): boolean {
  if (!usuario) return false;
  const permitidos =
    PERMISOS_POR_ROL[usuario.rol.nombre as (typeof ROLES)[keyof typeof ROLES]];
  return Array.isArray(permitidos) && permitidos.includes(permiso);
}

export function obtenerPermisos(usuario: UsuarioSesion): readonly Permiso[] {
  return (
    PERMISOS_POR_ROL[usuario.rol.nombre as (typeof ROLES)[keyof typeof ROLES]] ??
    []
  );
}

/// Regla de la sección 12 (RF-16): un Docente solo puede operar sobre los
/// cursos que le fueron asignados (filas de CursoDocente). Administrador y
/// Preceptor gestionan cualquier curso. Un Docente nunca puede crear/operar
/// sobre un curso inexistente o no asignado.
export function puedeGestionarCurso(
  usuario: UsuarioSesion | null | undefined,
  curso: { docentes?: { docenteId: number }[] } | null
): boolean {
  if (!usuario) return false;
  if (tienePermiso(usuario, PERMISOS.CURSOS_EDITAR)) return true;
  if (!esRol(usuario, ROLES.DOCENTE)) return false;
  if (!curso) return false;
  return (
    curso.docentes?.some((d) => d.docenteId === usuario.id) ?? false
  );
}

export type SeccionPanel = {
  clave:
    | "inicio"
    | "cursos"
    | "mis_cursos"
    | "usuarios"
    | "guia"
    | "noticias"
    | "sobre"
    | "faqs";
  titulo: string;
  descripcion: string;
  href?: string;
};

/// Secciones del panel que el usuario puede ver. Se calculan en el servidor
/// a partir de la matriz de permisos; las secciones no autorizadas no se
/// muestran en la navegación y, además, las rutas administrativas validadrán
/// el permiso en el backend para que no sean accesibles por URL.
export function obtenerSeccionesPanel(
  usuario: UsuarioSesion
): SeccionPanel[] {
  const secciones: SeccionPanel[] = [
    {
      clave: "inicio",
      titulo: "Resumen",
      descripcion: "Resumen del panel y atajos.",
      href: "/panel",
    },
  ];

  if (tienePermiso(usuario, PERMISOS.CURSOS_VER)) {
    if (esRol(usuario, ROLES.DOCENTE)) {
      secciones.push({
        clave: "mis_cursos",
        titulo: "Mis cursos",
        descripcion: "Gestión de los cursos que te fueron asignados.",
        href: "/panel",
      });
    } else {
      secciones.push({
        clave: "cursos",
        titulo: "Cursos",
        descripcion: "Alta, edición, eliminación y asignación de docentes.",
        href: "/panel/cursos",
      });
    }
  }

  if (tienePermiso(usuario, PERMISOS.USUARIOS_VER)) {
    const esAdministrador = esRol(usuario, ROLES.ADMINISTRADOR);
    secciones.push({
      clave: "usuarios",
      titulo: "Usuarios",
      descripcion: esAdministrador
        ? "Listado completo, alta y baja de cuentas del equipo."
        : "Alta de cuentas de docentes.",
      href: esAdministrador ? "/panel/usuarios" : "/panel/usuarios/nuevo",
    });
  }

  if (tienePermiso(usuario, PERMISOS.GUIA_EDITAR)) {
    secciones.push({
      clave: "guia",
      titulo: "Guía de inscripción",
      descripcion: "Edición del contenido público de la guía.",
      href: "/panel/guia",
    });
  }

  if (tienePermiso(usuario, PERMISOS.NOTICIAS_CREAR)) {
    secciones.push({
      clave: "noticias",
      titulo: "Noticias",
      descripcion: "Publicación y edición de las noticias del sitio.",
      href: "/panel/noticias",
    });
  }

  if (tienePermiso(usuario, PERMISOS.SOBRE_EL_CENTRO_EDITAR)) {
    secciones.push({
      clave: "sobre",
      titulo: "Sobre el centro",
      descripcion: "Edición de la página institucional con la historia del centro.",
      href: "/panel/sobre-el-centro",
    });
  }

  if (tienePermiso(usuario, PERMISOS.PREGUNTAS_FAQS_EDITAR)) {
    secciones.push({
      clave: "faqs",
      titulo: "Preguntas frecuentes",
      descripcion: "Categorías y preguntas de la página pública.",
      href: "/panel/preguntas-frecuentes",
    });
  }

  return secciones;
}