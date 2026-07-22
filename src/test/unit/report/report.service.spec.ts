import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ReportService } from 'src/modules/report/services/report.service';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { DashboardMetricsService } from 'src/modules/report/domain/dashboard-metrics.service';
import { CustomerMetricsService } from 'src/modules/report/domain/customer-metrics.service';
import { ServiceMetricsService } from 'src/modules/report/domain/service-metrics.service';
import { ProfessionalMetricsService } from 'src/modules/report/domain/professional-metrics.service';
import { RevenueCalculator } from 'src/modules/report/domain/revenue.calculator';

jest.mock('src/modules/report/utils/report-period.utils', () => ({
  getReportPeriod: jest.fn(() => ({
    start: new Date('2026-06-01T03:00:00.000Z'),
    end: new Date('2026-06-30T02:59:59.999Z'),
  })),
  listMonthsInPeriod: jest.fn(() => [{ year: 2026, month: 6 }]),
}));

jest.mock('src/modules/report/utils/report-query.utils', () => ({
  fetchBookingTotals: jest.fn(),
  fetchMonthlyBreakdown: jest.fn(),
}));

import { getReportPeriod } from 'src/modules/report/utils/report-period.utils';
import {
  fetchBookingTotals,
  fetchMonthlyBreakdown,
} from 'src/modules/report/utils/report-query.utils';

describe('ReportService', () => {
  let service: ReportService;
  const findTenantById = { run: jest.fn() };
  const customerMetrics = { countInPeriod: jest.fn() };
  const serviceMetrics = { topServices: jest.fn() };
  const professionalMetrics = { breakdown: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        RevenueCalculator,
        DashboardMetricsService,
        { provide: DataSource, useValue: {} },
        { provide: FindTenantByIdUseCase, useValue: findTenantById },
        { provide: CustomerMetricsService, useValue: customerMetrics },
        { provide: ServiceMetricsService, useValue: serviceMetrics },
        {
          provide: ProfessionalMetricsService,
          useValue: professionalMetrics,
        },
      ],
    }).compile();

    service = module.get(ReportService);
    findTenantById.run.mockResolvedValue({
      id: 'tenant-1',
      timezone: 'America/Sao_Paulo',
    });
    (fetchBookingTotals as jest.Mock).mockResolvedValue({
      revenue: 1000,
      confirmedBookings: 10,
      cancelledBookings: 0,
    });
    customerMetrics.countInPeriod.mockResolvedValue({
      newCustomers: 2,
      returningCustomers: 3,
    });
    serviceMetrics.topServices.mockResolvedValue([
      {
        serviceId: 's1',
        serviceName: 'Barba',
        quantity: 5,
        revenue: 250,
      },
    ]);
    (fetchMonthlyBreakdown as jest.Mock).mockResolvedValue([]);
    professionalMetrics.breakdown.mockResolvedValue([]);
  });

  it('buildStandard monta dashboard + topServices', async () => {
    const result = await service.buildStandard('tenant-1');

    expect(getReportPeriod).toHaveBeenCalledWith('America/Sao_Paulo', 0);
    expect(result.dashboard).toMatchObject({
      revenue: 1000,
      averageTicket: 100,
      newCustomers: 2,
      returningCustomers: 3,
    });
    expect(result.topServices).toHaveLength(1);
    expect(result.insights).toBeNull();
  });

  it('buildElite inclui monthly e professional', async () => {
    const result = await service.buildElite('tenant-1');
    expect(getReportPeriod).toHaveBeenCalledWith('America/Sao_Paulo', 5);
    expect(result).toHaveProperty('monthlyBreakdown');
    expect(result).toHaveProperty('professionalBreakdown');
    expect(professionalMetrics.breakdown).toHaveBeenCalled();
  });
});
