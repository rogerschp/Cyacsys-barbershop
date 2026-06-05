import { DateTime } from 'luxon';

export interface ReportPeriod {
  start: Date;
  end: Date;
}

export function getReportPeriod(
  timezone: string,
  monthsBack: number,
): ReportPeriod {
  const tz = timezone || 'America/Sao_Paulo';
  const now = DateTime.now().setZone(tz);
  const start = now.minus({ months: monthsBack }).startOf('month');
  const end = now.endOf('day');

  return {
    start: start.toUTC().toJSDate(),
    end: end.toUTC().toJSDate(),
  };
}

export interface MonthBucket {
  year: number;
  month: number;
}

export function listMonthsInPeriod(
  timezone: string,
  monthsBack: number,
): MonthBucket[] {
  const tz = timezone || 'America/Sao_Paulo';
  const now = DateTime.now().setZone(tz);
  const start = now.minus({ months: monthsBack }).startOf('month');
  const buckets: MonthBucket[] = [];

  let cursor = start;
  while (cursor <= now) {
    buckets.push({ year: cursor.year, month: cursor.month });
    cursor = cursor.plus({ months: 1 });
  }

  return buckets;
}
