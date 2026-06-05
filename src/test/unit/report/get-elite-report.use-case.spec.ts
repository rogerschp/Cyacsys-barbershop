import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { GetEliteReportUseCase } from 'src/modules/report/use-cases/get-elite-report.use-case';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';

jest.mock('src/modules/report/utils/report-period.utils', () => ({
  getReportPeriod: jest.fn(() => ({
    start: new Date('2026-01-01T03:00:00.000Z'),
    end: new Date('2026-06-04T23:59:59.999Z'),
  })),
  listMonthsInPeriod: jest.fn(() => [{ year: 2026, month: 6 }]),
}));

jest.mock('src/modules/report/utils/report-query.utils', () => ({
  fetchBookingTotals: jest.fn(),
  fetchMonthlyBreakdown: jest.fn(),
  fetchProfessionalBreakdown: jest.fn(),
}));

import {
  getReportPeriod,
  listMonthsInPeriod,
} from 'src/modules/report/utils/report-period.utils';
import {
  fetchBookingTotals,
  fetchMonthlyBreakdown,
  fetchProfessionalBreakdown,
} from 'src/modules/report/utils/report-query.utils';

describe('GetEliteReportUseCase', () => {
  let useCase: GetEliteReportUseCase;
  const findTenantById = { run: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEliteReportUseCase,
        { provide: DataSource, useValue: {} },
        { provide: FindTenantByIdUseCase, useValue: findTenantById },
      ],
    }).compile();

    useCase = module.get(GetEliteReportUseCase);
    findTenantById.run.mockResolvedValue({
      id: 'tenant-1',
      timezone: 'America/Sao_Paulo',
    });
    (fetchBookingTotals as jest.Mock).mockResolvedValue({
      revenue: 5000,
      confirmedBookings: 120,
      cancelledBookings: 8,
    });
    (fetchMonthlyBreakdown as jest.Mock).mockResolvedValue([]);
    (fetchProfessionalBreakdown as jest.Mock).mockResolvedValue([
      {
        tenantProfessionalId: 'tp-1',
        professionalName: 'João',
        revenue: 3000,
        confirmedBookings: 70,
        cancelledBookings: 2,
      },
    ]);
  });

  it('retorna relatório ELITE com breakdown por profissional', async () => {
    const result = await useCase.run('tenant-1');

    expect(getReportPeriod).toHaveBeenCalledWith('America/Sao_Paulo', 5);
    expect(listMonthsInPeriod).toHaveBeenCalledWith('America/Sao_Paulo', 5);
    expect(fetchProfessionalBreakdown).toHaveBeenCalled();
    expect(result.professionalBreakdown).toHaveLength(1);
    expect(result.insights).toBeNull();
  });
});
