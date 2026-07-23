import { BusinessRuleException } from '../../../../common/exceptions/business-rule.exception';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireUuid(
  value: string | null | undefined,
  field: string,
): string {
  const trimmed = value?.trim();
  if (!trimmed || !UUID_RE.test(trimmed)) {
    throw new BusinessRuleException(
      'MEDIA_STORAGE_CONTEXT_REQUIRED',
      `Contexto de storage inválido: ${field} é obrigatório e deve ser um UUID.`,
      { field },
    );
  }
  return trimmed;
}
