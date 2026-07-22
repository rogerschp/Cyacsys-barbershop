import { onlyDigits } from './only-digits';

/**
 * Normaliza CNPJ para 14 dígitos (sem máscara).
 * Retorna null se não tiver exatamente 14 dígitos após limpeza.
 */
export function normalizeCnpj(raw: unknown): string | null {
  const digits = onlyDigits(raw);
  if (digits.length !== 14) return null;
  return digits;
}

function cnpjCheckDigit(base: string, weights: number[]): number {
  const sum = base
    .split('')
    .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

/**
 * Valida CNPJ com dígitos verificadores (Receita Federal).
 * Aceita mascarado ou só dígitos.
 */
export function isValidCnpj(raw: unknown): boolean {
  const digits = normalizeCnpj(raw);
  if (!digits) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = cnpjCheckDigit(digits.slice(0, 12), w1);
  const d2 = cnpjCheckDigit(digits.slice(0, 12) + String(d1), w2);
  return digits === `${digits.slice(0, 12)}${d1}${d2}`;
}
