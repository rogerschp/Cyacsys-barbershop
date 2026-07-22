/** Extrai apenas dígitos de um valor de entrada. */
export function onlyDigits(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw).replace(/\D/g, '');
}
