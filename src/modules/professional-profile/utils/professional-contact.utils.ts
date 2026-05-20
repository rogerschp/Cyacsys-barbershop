import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';

const WHATSAPP_DIGITS_PATTERN = /^\d{10,15}$/;
const INSTAGRAM_USERNAME_PATTERN = /^[a-zA-Z0-9._]{1,30}$/;

export function normalizeWhatsappNumber(
  raw: string | null | undefined,
): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) {
    return null;
  }
  return digits;
}

export function normalizeInstagramUsername(
  raw: string | null | undefined,
): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  let value = raw.trim();
  if (value.startsWith('@')) {
    value = value.slice(1);
  }
  if (value.length === 0) {
    return null;
  }
  return value;
}

export function assertValidWhatsappNumber(digits: string | null): void {
  if (digits === null) {
    return;
  }
  if (!WHATSAPP_DIGITS_PATTERN.test(digits)) {
    throw new BusinessRuleException(
      'INVALID_WHATSAPP_NUMBER',
      'whatsappNumber deve conter entre 10 e 15 dígitos (apenas números).',
    );
  }
}

export function assertValidInstagramUsername(username: string | null): void {
  if (username === null) {
    return;
  }
  if (!INSTAGRAM_USERNAME_PATTERN.test(username)) {
    throw new BusinessRuleException(
      'INVALID_INSTAGRAM_USERNAME',
      'instagramUsername inválido (use letras, números, ponto e underscore; máx. 30 caracteres, sem @).',
    );
  }
}
