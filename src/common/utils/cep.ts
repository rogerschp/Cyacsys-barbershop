import { onlyDigits } from './only-digits';

/**
 * Normaliza CEP para o formato canônico `#####-###`.
 * Aceita `01001000` ou `01001-000`.
 * Retorna null se não tiver exatamente 8 dígitos.
 */
export function normalizeCep(raw: unknown): string | null {
  const digits = onlyDigits(raw);
  if (digits.length !== 8) return null;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Valida CEP brasileiro (8 dígitos). Não consulta ViaCEP.
 * Rejeita `00000000`.
 */
export function isValidCep(raw: unknown): boolean {
  const digits = onlyDigits(raw);
  if (digits.length !== 8) return false;
  if (digits === '00000000') return false;
  return true;
}
