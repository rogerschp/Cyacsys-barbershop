import { BusinessRuleException } from '../exceptions/business-rule.exception';
import { onlyDigits } from './only-digits';

/**
 * Tenta normalizar telefone para dígitos com DDI (sem '+').
 * Entradas BR locais (10–11 dígitos) recebem prefixo 55.
 * Retorna null se inválido (uso em Transform/validators).
 */
export function tryNormalizePhone(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  let digits = onlyDigits(trimmed);
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  if (digits.length < 12 || digits.length > 15) {
    return null;
  }

  return digits;
}

/**
 * Normaliza telefone ou lança erro de domínio.
 * Preferir em use cases; nos DTOs use tryNormalizePhone + validator.
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    throw new BusinessRuleException(
      'INVALID_PHONE',
      'Telefone é obrigatório.',
    );
  }

  const normalized = tryNormalizePhone(raw);
  if (!normalized) {
    throw new BusinessRuleException(
      'INVALID_PHONE',
      'Telefone inválido. Use DDI + DDD + número (ex.: 5511999999999).',
    );
  }
  return normalized;
}
