/// Validaciones compartidas entre el panel y la API: una sola fuente para que el
/// formulario y el servidor rechacen exactamente lo mismo.

/// DNI: 7 u 8 dígitos, sin guiones ni espacios.
export const REGEX_DNI = /^\d{7,8}$/;

/// Email: check funcional suficiente para el alta de usuarios.
export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esEmailValido(valor: string): boolean {
  return REGEX_EMAIL.test(valor.trim());
}