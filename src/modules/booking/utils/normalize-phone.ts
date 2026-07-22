import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';

/**
 * Normaliza telefone para dígitos com DDI (sem '+').
 * Entradas BR locais (10–11 dígitos) recebem prefixo 55.
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    throw new BusinessRuleException(
      'INVALID_PHONE',
      'Telefone é obrigatório.',
    );
  }

  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  if (digits.length < 12 || digits.length > 15) {
    throw new BusinessRuleException(
      'INVALID_PHONE',
      'Telefone inválido. Use DDI + DDD + número (ex.: 5511999999999).',
    );
  }

  return digits;
}
