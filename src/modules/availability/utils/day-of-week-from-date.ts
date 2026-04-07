import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { DayOfWeek } from '../entities/day-of-week.enum';

const BY_LUXON_WEEKDAY: Record<number, DayOfWeek> = {
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
  7: DayOfWeek.SUNDAY,
};

/** Data civil `yyyy-MM-dd` interpretada no timezone do tenant → dia da semana. */
export function dayOfWeekForTenantDate(
  dateYmd: string,
  tenantTimezone: string,
): DayOfWeek {
  const dt = DateTime.fromISO(dateYmd, { zone: tenantTimezone });
  if (!dt.isValid) {
    throw new BusinessRuleException(
      'INVALID_DATE',
      'Data inválida ou timezone do tenant inválido.',
    );
  }
  const w = dt.weekday;
  return BY_LUXON_WEEKDAY[w];
}
