import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { EliteReportDto } from '../dto/elite-report.dto';
import {
  getReportPeriod,
  listMonthsInPeriod,
} from '../utils/report-period.utils';
import {
  fetchBookingTotals,
  fetchMonthlyBreakdown,
  fetchProfessionalBreakdown,
} from '../utils/report-query.utils';

@Injectable()
export class GetEliteReportUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(tenantId: string): Promise<EliteReportDto> {
    const tenant = await this.findTenantByIdUseCase.run(tenantId);
    const period = getReportPeriod(tenant.timezone, 5);
    const monthBuckets = listMonthsInPeriod(tenant.timezone, 5);

    const [totals, monthlyBreakdown, professionalBreakdown] = await Promise.all(
      [
        fetchBookingTotals(this.dataSource, tenantId, period.start, period.end),
        fetchMonthlyBreakdown(
          this.dataSource,
          tenantId,
          tenant.timezone,
          period.start,
          period.end,
          monthBuckets,
        ),
        fetchProfessionalBreakdown(
          this.dataSource,
          tenantId,
          period.start,
          period.end,
        ),
      ],
    );

    return {
      period,
      revenue: totals.revenue,
      confirmedBookings: totals.confirmedBookings,
      cancelledBookings: totals.cancelledBookings,
      monthlyBreakdown,
      professionalBreakdown,
      insights: null,
    };
  }
}
