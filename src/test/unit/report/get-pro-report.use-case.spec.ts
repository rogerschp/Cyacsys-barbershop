import { Test, TestingModule } from '@nestjs/testing';
import { GetProReportUseCase } from 'src/modules/report/use-cases/get-pro-report.use-case';
import { ReportService } from 'src/modules/report/services/report.service';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';

describe('GetProReportUseCase', () => {
  let useCase: GetProReportUseCase;
  const reportService = { buildPro: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProReportUseCase,
        { provide: ReportService, useValue: reportService },
      ],
    }).compile();

    useCase = module.get(GetProReportUseCase);
    reportService.buildPro.mockResolvedValue({
      period: {
        start: new Date('2026-04-01T03:00:00.000Z'),
        end: new Date('2026-06-04T23:59:59.999Z'),
      },
      revenue: 1500,
      confirmedBookings: 40,
      cancelledBookings: 3,
      dashboard: {
        revenue: 1500,
        confirmedBookings: 40,
        cancelledBookings: 3,
        cancellationRate: 6.98,
        averageTicket: 37.5,
        newCustomers: 5,
        returningCustomers: 8,
      },
      topServices: [
        {
          serviceId: 's1',
          serviceName: 'Corte',
          quantity: 20,
          revenue: 1000,
        },
      ],
      monthlyBreakdown: [
        {
          year: 2026,
          month: 4,
          revenue: 400,
          confirmedBookings: 10,
          cancelledBookings: 1,
          revenueChangePercent: null,
        },
      ],
      insights: null,
    });
  });

  it('usa 3 meses por default', async () => {
    const result = await useCase.run('tenant-1');
    expect(reportService.buildPro).toHaveBeenCalledWith('tenant-1', 3);
    expect(result.monthlyBreakdown).toHaveLength(1);
  });

  it('aceita months=1', async () => {
    await useCase.run('tenant-1', '1');
    expect(reportService.buildPro).toHaveBeenCalledWith('tenant-1', 1);
  });

  it('rejeita months acima do teto PRO', () => {
    expect(() => useCase.run('tenant-1', 6)).toThrow(BusinessRuleException);
  });
});
