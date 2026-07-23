import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { DayRangeUtc, resolveDayRangeUtc } from '../utils/resolve-day-range';

export interface OpsDateFilterInput {
  date?: string;
  from?: string;
  to?: string;
}

const MAX_RANGE_DAYS = 31;

/**
 * Resolve filtro temporal da agenda ops:
 * - `date` XOR (`from`+`to`)
 * - nenhum → undefined (sem filtro)
 * - combinação inválida → BOOKING_INVALID_DATE_FILTER
 * - intervalo > 31 dias → BOOKING_DATE_RANGE_TOO_LARGE
 */
export function resolveOpsDateFilter(
  input: OpsDateFilterInput,
  timezone: string,
): DayRangeUtc | undefined {
  const hasDate = Boolean(input.date?.trim());
  const hasFrom = Boolean(input.from?.trim());
  const hasTo = Boolean(input.to?.trim());

  if (hasDate && (hasFrom || hasTo)) {
    throw new BusinessRuleException(
      'BOOKING_INVALID_DATE_FILTER',
      'Use apenas date ou o par from/to, nunca juntos.',
    );
  }

  if (hasFrom !== hasTo) {
    throw new BusinessRuleException(
      'BOOKING_INVALID_DATE_FILTER',
      'from e to devem ser informados juntos.',
    );
  }

  if (hasDate) {
    return resolveDayRangeUtc(input.date!.trim(), timezone);
  }

  if (!hasFrom) {
    return undefined;
  }

  const zone = timezone || 'America/Sao_Paulo';
  const fromStart = DateTime.fromISO(input.from!.trim(), { zone }).startOf(
    'day',
  );
  const toStart = DateTime.fromISO(input.to!.trim(), { zone }).startOf('day');

  if (!fromStart.isValid || !toStart.isValid) {
    throw new BusinessRuleException(
      'BOOKING_INVALID_DATE_FILTER',
      'Data inválida. Use o formato yyyy-MM-dd.',
    );
  }

  if (fromStart > toStart) {
    throw new BusinessRuleException(
      'BOOKING_INVALID_DATE_FILTER',
      'from não pode ser posterior a to.',
    );
  }

  const inclusiveDays = toStart.diff(fromStart, 'days').days + 1;
  if (inclusiveDays > MAX_RANGE_DAYS) {
    throw new BusinessRuleException(
      'BOOKING_DATE_RANGE_TOO_LARGE',
      `O intervalo máximo permitido é de ${MAX_RANGE_DAYS} dias.`,
    );
  }

  return {
    rangeStart: fromStart.toUTC().toJSDate(),
    rangeEnd: toStart.plus({ days: 1 }).toUTC().toJSDate(),
  };
}
