import { DateTime } from 'luxon';
import {
  getReportPeriod,
  listMonthsInPeriod,
} from 'src/modules/report/utils/report-period.utils';

describe('report-period.utils', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getReportPeriod usa timezone do tenant e início do mês', () => {
    jest.spyOn(DateTime, 'now').mockReturnValue(
      DateTime.fromObject(
        { year: 2026, month: 6, day: 4, hour: 15 },
        { zone: 'America/Sao_Paulo' },
      ) as DateTime<true>,
    );

    const period = getReportPeriod('America/Sao_Paulo', 0);

    expect(period.start).toEqual(
      DateTime.fromObject(
        { year: 2026, month: 6, day: 1, hour: 0, minute: 0, second: 0 },
        { zone: 'America/Sao_Paulo' },
      )
        .toUTC()
        .toJSDate(),
    );
    expect(
      DateTime.fromJSDate(period.end).setZone('America/Sao_Paulo').day,
    ).toBe(4);
  });

  it('getReportPeriod usa fallback quando timezone vazio', () => {
    jest.spyOn(DateTime, 'now').mockReturnValue(
      DateTime.fromObject(
        { year: 2026, month: 3, day: 10 },
        { zone: 'America/Sao_Paulo' },
      ) as DateTime<true>,
    );

    const period = getReportPeriod('', 2);

    expect(period.start.getUTCMonth()).toBe(0);
  });

  it('listMonthsInPeriod retorna buckets do período PRO (3 meses)', () => {
    jest.spyOn(DateTime, 'now').mockReturnValue(
      DateTime.fromObject(
        { year: 2026, month: 6, day: 15 },
        { zone: 'America/Sao_Paulo' },
      ) as DateTime<true>,
    );

    const buckets = listMonthsInPeriod('America/Sao_Paulo', 2);

    expect(buckets).toEqual([
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
    ]);
  });
});
