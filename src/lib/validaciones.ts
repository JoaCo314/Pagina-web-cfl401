/// Validaciones compartidas entre el panel y la API: una sola fuente para que el
/// formulario y el servidor rechacen exactamente lo mismo.

/// DNI: 7 u 8 dígitos, sin guiones ni espacios.
export const REGEX_DNI = /^\d{7,8}$/;

/// Email: check funcional suficiente para el alta de usuarios.
export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esEmailValido(valor: string): boolean {
  return REGEX_EMAIL.test(valor.trim());
}

/// Teléfono: se acepta un formato flexible (con +, espacios, guiones y
/// paréntesis) para no pelear con la forma en que cada uno lo escribe, pero se
/// exige una cantidad razonable de dígitos. Se usa para el teléfono de contacto
/// de la cuenta (no se publica en el sitio).
export const REGEX_TELEFONO = /^\+?[\d\s().-]{6,25}$/;

export function esTelefonoValido(valor: string): boolean {
  const texto = valor.trim();
  if (!REGEX_TELEFONO.test(texto)) return false;
  const digitos = texto.replace(/\D/g, "");
  return digitos.length >= 6 && digitos.length <= 15;
}