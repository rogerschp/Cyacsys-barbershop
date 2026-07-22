import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';

export interface DayRangeUtc {
  rangeStart: Date;
  rangeEnd: Date;
}

/**
 * Converte uma data no formato yyyy-MM-dd (no fuso do tenant) em um intervalo
 * [início do dia, início do dia seguinte) em UTC para filtrar bookings.
 */
export function resolveDayRangeUtc(
  date: string,
  timezone: string,
): DayRangeUtc {
  const zone = timezone || 'America/Sao_Paulo';
  const start = DateTime.fromISO(date, { zone }).startOf('day');
  if (!start.isValid) {
    throw new BusinessRuleException(
      'INVALID_DATE',
      'Data inválida. Use o formato yyyy-MM-dd.',
    );
  }
  const end = start.plus({ days: 1 });
  return {
    rangeStart: start.toUTC().toJSDate(),
    rangeEnd: end.toUTC().toJSDate(),
  };
}
