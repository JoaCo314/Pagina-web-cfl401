/// Extrae la URL de un iframe de mapas pegado completo (Compartir → Insertar
/// un mapa). Si el valor no es un iframe, lo devuelve tal cual.
export function extraerUrlIframe(valor: string): string {
  const limpio = valor.trim();
  const coincidencia = limpio.match(/<iframe[^>]*\bsrc=(["'])(.*?)\1/i);
  return coincidencia ? coincidencia[2] : limpio;
}