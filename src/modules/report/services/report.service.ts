import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { EliteReportDto } from '../dto/elite-report.dto';
import { ProReportDto } from '../dto/pro-report.dto';
import { StandardReportDto } from '../dto/standard-report.dto';
import { CustomerMetricsService } from '../domain/customer-metrics.service';
import { DashboardMetricsService } from '../domain/dashboard-metrics.service';
import { ProfessionalMetricsService } from '../domain/professional-metrics.service';
import { ServiceMetricsService } from '../domain/service-metrics.service';
import {
  getReportPeriod,
  listMonthsInPeriod,
} from '../utils/report-period.utils';
import {
  fetchBookingTotals,
  fetchMonthlyBreakdown,
} from '../utils/report-query.utils';

@Injectable()
export class ReportService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    private readonly dashboardMetricsService: DashboardMetricsService,
    private readonly customerMetricsService: CustomerMetricsService,
    private readonly serviceMetricsService: ServiceMetricsService,
    private readonly professionalMetricsService: ProfessionalMetricsService,
  ) {}

  async buildStandard(tenantId: string): Promise<StandardReportDto> {
    return this.buildReport(tenantId, 0, {
      monthly: false,
      professionals: false,
    }) as Promise<StandardReportDto>;
  }

  async buildPro(
    tenantId: string,
    monthsCount: number = 3,
  ): Promise<ProReportDto> {
    return this.buildReport(tenantId, monthsCount - 1, {
      monthly: true,
      professionals: false,
    }) as Promise<ProReportDto>;
  }

  async buildElite(
    tenantId: string,
    monthsCount: number = 6,
  ): Promise<EliteReportDto> {
    return this.buildReport(tenantId, monthsCount - 1, {
      monthly: true,
      professionals: true,
    }) as Promise<EliteReportDto>;
  }

  private async buildReport(
    tenantId: string,
    monthsBack: number,
    options: { monthly: boolean; professionals: boolean },
  ): Promise<StandardReportDto | ProReportDto | EliteReportDto> {
    const tenant = await this.findTenantByIdUseCase.run(tenantId);
    const period = getReportPeriod(tenant.timezone, monthsBack);

    const [totals, customers, topServices] = await Promise.all([
      fetchBookingTotals(
        this.dataSource,
        tenantId,
        period.start,
        period.end,
      ),
      this.customerMetricsService.countInPeriod(
        tenantId,
        period.start,
        period.end,
      ),
      this.serviceMetricsService.topServices(
        tenantId,
        period.start,
        period.end,
      ),
    ]);

    const dashboard = this.dashboardMetricsService.build({
      ...totals,
      ...customers,
    });

    const base: StandardReportDto = {
      period,
      revenue: totals.revenue,
      confirmedBookings: totals.confirmedBookings,
      cancelledBookings: totals.cancelledBookings,
      dashboard,
      topServices,
      insights: null,
    };

    if (!options.monthly && !options.professionals) {
      return base;
    }

    const monthBuckets = listMonthsInPeriod(tenant.timezone, monthsBack);
    const [monthlyBreakdown, professionalBreakdown] = await Promise.all([
      options.monthly
        ? fetchMonthlyBreakdown(
            this.dataSource,
            tenantId,
            tenant.timezone,
            period.start,
            period.end,
            monthBuckets,
          )
        : Promise.resolve(undefined),
      options.professionals
        ? this.professionalMetricsService.breakdown(
            tenantId,
            period.start,
            period.end,
          )
        : Promise.resolve(undefined),
    ]);

    if (options.professionals) {
      return {
        ...base,
        monthlyBreakdown: monthlyBreakdown ?? [],
        professionalBreakdown: professionalBreakdown ?? [],
      } satisfies EliteReportDto;
    }

    return {
      ...base,
      monthlyBreakdown: monthlyBreakdown ?? [],
    } satisfies ProReportDto;
  }
}
