import { Test, TestingModule } from '@nestjs/testing';
import { GetStandardReportUseCase } from 'src/modules/report/use-cases/get-standard-report.use-case';
import { ReportService } from 'src/modules/report/services/report.service';

describe('GetStandardReportUseCase', () => {
  let useCase: GetStandardReportUseCase;
  const reportService = { buildStandard: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetStandardReportUseCase,
        { provide: ReportService, useValue: reportService },
      ],
    }).compile();

    useCase = module.get(GetStandardReportUseCase);
    reportService.buildStandard.mockResolvedValue({
      period: {
        start: new Date('2026-06-01T03:00:00.000Z'),
        end: new Date('2026-06-04T23:59:59.999Z'),
      },
      revenue: 500,
      confirmedBookings: 12,
      cancelledBookings: 1,
      dashboard: {
        revenue: 500,
        confirmedBookings: 12,
        cancelledBookings: 1,
        cancellationRate: 7.69,
        averageTicket: 41.67,
        newCustomers: 3,
        returningCustomers: 2,
      },
      topServices: [],
      insights: null,
    });
  });

  it('delega ao ReportService', async () => {
    const result = await useCase.run('tenant-1');
    expect(reportService.buildStandard).toHaveBeenCalledWith('tenant-1');
    expect(result.dashboard.averageTicket).toBe(41.67);
    expect(result.insights).toBeNull();
  });
});
