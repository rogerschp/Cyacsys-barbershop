import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { GetStandardReportUseCase } from 'src/modules/report/use-cases/get-standard-report.use-case';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';

jest.mock('src/modules/report/utils/report-period.utils', () => ({
  getReportPeriod: jest.fn(() => ({
    start: new Date('2026-06-01T03:00:00.000Z'),
    end: new Date('2026-06-04T23:59:59.999Z'),
  })),
}));

jest.mock('src/modules/report/utils/report-query.utils', () => ({
  fetchBookingTotals: jest.fn(),
}));

import { getReportPeriod } from 'src/modules/report/utils/report-period.utils';
import { fetchBookingTotals } from 'src/modules/report/utils/report-query.utils';

describe('GetStandardReportUseCase', () => {
  let useCase: GetStandardReportUseCase;
  const findTenantById = { run: jest.fn() };
  const dataSource = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetStandardReportUseCase,
        { provide: DataSource, useValue: dataSource },
        { provide: FindTenantByIdUseCase, useValue: findTenantById },
      ],
    }).compile();

    useCase = module.get(GetStandardReportUseCase);
    findTenantById.run.mockResolvedValue({
      id: 'tenant-1',
      timezone: 'America/Sao_Paulo',
    });
    (fetchBookingTotals as jest.Mock).mockResolvedValue({
      revenue: 500,
      confirmedBookings: 12,
      cancelledBookings: 1,
    });
  });

  it('retorna relatório standard do mês atual', async () => {
    const result = await useCase.run('tenant-1');

    expect(getReportPeriod).toHaveBeenCalledWith('America/Sao_Paulo', 0);
    expect(fetchBookingTotals).toHaveBeenCalled();
    expect(result).toEqual({
      period: {
        start: new Date('2026-06-01T03:00:00.000Z'),
        end: new Date('2026-06-04T23:59:59.999Z'),
      },
      revenue: 500,
      confirmedBookings: 12,
      cancelledBookings: 1,
      insights: null,
    });
  });
});
