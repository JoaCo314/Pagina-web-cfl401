/// Constantes de subida de imágenes compartidas entre el servidor y el cliente
/// (este archivo no debe importar módulos de servidor para poder usarse en
/// componentes cliente).
export const TIPOS_IMAGEN_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

/// El mismo tope expresado en MB redondeados, para los mensajes de error: así
/// nunca se desincroniza si se cambia `TAMANO_MAXIMO_IMAGEN`.
export const TAMANO_MAXIMO_IMAGEN_MB = Math.round(
  TAMANO_MAXIMO_IMAGEN / (1024 * 1024)
);
