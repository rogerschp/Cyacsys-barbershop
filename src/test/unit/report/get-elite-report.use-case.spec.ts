import { Test, TestingModule } from '@nestjs/testing';
import { GetEliteReportUseCase } from 'src/modules/report/use-cases/get-elite-report.use-case';
import { ReportService } from 'src/modules/report/services/report.service';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';

describe('GetEliteReportUseCase', () => {
  let useCase: GetEliteReportUseCase;
  const reportService = { buildElite: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEliteReportUseCase,
        { provide: ReportService, useValue: reportService },
      ],
    }).compile();

    useCase = module.get(GetEliteReportUseCase);
    reportService.buildElite.mockResolvedValue({
      period: {
        start: new Date('2026-01-01T03:00:00.000Z'),
        end: new Date('2026-06-04T23:59:59.999Z'),
      },
      revenue: 5000,
      completedBookings: 120,
      cancelledBookings: 8,
      dashboard: {
        revenue: 5000,
        completedBookings: 120,
        cancelledBookings: 8,
        cancellationRate: 6.25,
        averageTicket: 41.67,
        newCustomers: 10,
        returningCustomers: 20,
      },
      topServices: [],
      monthlyBreakdown: [],
      professionalBreakdown: [
        {
          tenantProfessionalId: 'tp-1',
          professionalName: 'João',
          revenue: 3000,
          completedBookings: 70,
          cancelledBookings: 2,
          averageTicket: 42.86,
          cancellationRate: 2.78,
        },
      ],
      insights: null,
    });
  });

  it('usa 6 meses por default', async () => {
    await useCase.run('tenant-1');
    expect(reportService.buildElite).toHaveBeenCalledWith('tenant-1', 6);
  });

  it('aceita months=1, 3 e 6', async () => {
    await useCase.run('tenant-1', 1);
    expect(reportService.buildElite).toHaveBeenCalledWith('tenant-1', 1);

    await useCase.run('tenant-1', '3');
    expect(reportService.buildElite).toHaveBeenCalledWith('tenant-1', 3);

    await useCase.run('tenant-1', 6);
    expect(reportService.buildElite).toHaveBeenCalledWith('tenant-1', 6);
  });

  it('rejeita months inválido', async () => {
    expect(() => useCase.run('tenant-1', 0)).toThrow(BusinessRuleException);
    expect(() => useCase.run('tenant-1', 13)).toThrow(BusinessRuleException);
  });
});
