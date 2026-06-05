import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { GetProReportUseCase } from 'src/modules/report/use-cases/get-pro-report.use-case';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';

jest.mock('src/modules/report/utils/report-period.utils', () => ({
  getReportPeriod: jest.fn(() => ({
    start: new Date('2026-04-01T03:00:00.000Z'),
    end: new Date('2026-06-04T23:59:59.999Z'),
  })),
  listMonthsInPeriod: jest.fn(() => [
    { year: 2026, month: 4 },
    { year: 2026, month: 5 },
    { year: 2026, month: 6 },
  ]),
}));

jest.mock('src/modules/report/utils/report-query.utils', () => ({
  fetchBookingTotals: jest.fn(),
  fetchMonthlyBreakdown: jest.fn(),
}));

import {
  getReportPeriod,
  listMonthsInPeriod,
} from 'src/modules/report/utils/report-period.utils';
import {
  fetchBookingTotals,
  fetchMonthlyBreakdown,
} from 'src/modules/report/utils/report-query.utils';

describe('GetProReportUseCase', () => {
  let useCase: GetProReportUseCase;
  const findTenantById = { run: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProReportUseCase,
        { provide: DataSource, useValue: {} },
        { provide: FindTenantByIdUseCase, useValue: findTenantById },
      ],
    }).compile();

    useCase = module.get(GetProReportUseCase);
    findTenantById.run.mockResolvedValue({
      id: 'tenant-1',
      timezone: 'America/Sao_Paulo',
    });
    (fetchBookingTotals as jest.Mock).mockResolvedValue({
      revenue: 1500,
      confirmedBookings: 40,
      cancelledBookings: 3,
    });
    (fetchMonthlyBreakdown as jest.Mock).mockResolvedValue([
      {
        year: 2026,
        month: 4,
        revenue: 400,
        confirmedBookings: 10,
        cancelledBookings: 1,
        revenueChangePercent: null,
      },
    ]);
  });

  it('retorna relatório PRO com breakdown mensal', async () => {
    const result = await useCase.run('tenant-1');

    expect(getReportPeriod).toHaveBeenCalledWith('America/Sao_Paulo', 2);
    expect(listMonthsInPeriod).toHaveBeenCalledWith('America/Sao_Paulo', 2);
    expect(result.revenue).toBe(1500);
    expect(result.monthlyBreakdown).toHaveLength(1);
    expect(result.insights).toBeNull();
  });
});
