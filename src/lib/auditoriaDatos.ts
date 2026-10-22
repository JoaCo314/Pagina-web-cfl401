// Creado por Joaquin para la pagina web del CFL 401 (Centro de Formacion Laboral 401).

/// Verbos que se registran en la auditoría. Son cortos y estables: se usan para
/// filtrar en el panel, así que renombrarlos cambia el historial guardado.
export const ACCIONES_AUDITORIA = {
  CREAR: "crear",
  EDITAR: "editar",
  ELIMINAR: "eliminar",
  ACTIVAR: "activar",
  DESACTIVAR: "desactivar",
  BLANQUEAR: "blanquear",
  ASIGNAR_DOCENTES: "asignar_docentes",
  MARCAR_LEIDA: "marcar_leida",
  BLOQUEAR: "bloquear",
} as const;

export const RECURSOS_AUDITORIA = {
  USUARIO: "usuario",
  CURSO: "curso",
  CATEGORIA_CURSO: "categoria_curso",
  NOTICIA: "noticia",
  PREGUNTA: "pregunta",
  CATEGORIA_PREGUNTA: "categoria_pregunta",
  GUIA: "guia",
  SOBRE_EL_CENTRO: "sobre_el_centro",
  SITE_CONFIG: "site_config",
  IMAGEN: "imagen",
  CONSULTA: "consulta",
} as const;

export type AccionAuditoria =
  (typeof ACCIONES_AUDITORIA)[keyof typeof ACCIONES_AUDITORIA];
export type RecursoAuditoria =
  (typeof RECURSOS_AUDITORIA)[keyof typeof RECURSOS_AUDITORIA];

export const ETIQUETAS_ACCION: Record<string, string> = {
  [ACCIONES_AUDITORIA.CREAR]: "Creó",
  [ACCIONES_AUDITORIA.EDITAR]: "Editó",
  [ACCIONES_AUDITORIA.ELIMINAR]: "Eliminó",
  [ACCIONES_AUDITORIA.ACTIVAR]: "Activó",
  [ACCIONES_AUDITORIA.DESACTIVAR]: "Desactivó",
  [ACCIONES_AUDITORIA.BLANQUEAR]: "Blanqueó la contraseña",
  [ACCIONES_AUDITORIA.ASIGNAR_DOCENTES]: "Asignó docentes",
  [ACCIONES_AUDITORIA.MARCAR_LEIDA]: "Marcó como leída",
  [ACCIONES_AUDITORIA.BLOQUEAR]: "Bloqueó la cuenta",
};

export const ETIQUETAS_RECURSO: Record<string, string> = {
  [RECURSOS_AUDITORIA.USUARIO]: "Usuarios",
  [RECURSOS_AUDITORIA.CURSO]: "Cursos",
  [RECURSOS_AUDITORIA.CATEGORIA_CURSO]: "Categorías de cursos",
  [RECURSOS_AUDITORIA.NOTICIA]: "Noticias",
  [RECURSOS_AUDITORIA.PREGUNTA]: "Preguntas frecuentes",
  [RECURSOS_AUDITORIA.CATEGORIA_PREGUNTA]: "Categorías de preguntas",
  [RECURSOS_AUDITORIA.GUIA]: "Guía de inscripción",
  [RECURSOS_AUDITORIA.SOBRE_EL_CENTRO]: "Sobre el centro",
  [RECURSOS_AUDITORIA.SITE_CONFIG]: "Configuración del sitio",
  [RECURSOS_AUDITORIA.IMAGEN]: "Imágenes",
  [RECURSOS_AUDITORIA.CONSULTA]: "Consultas",
};
