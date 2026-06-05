import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { ProReportDto } from '../dto/pro-report.dto';
import {
  getReportPeriod,
  listMonthsInPeriod,
} from '../utils/report-period.utils';
import {
  fetchBookingTotals,
  fetchMonthlyBreakdown,
} from '../utils/report-query.utils';

@Injectable()
export class GetProReportUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(tenantId: string): Promise<ProReportDto> {
    const tenant = await this.findTenantByIdUseCase.run(tenantId);
    const period = getReportPeriod(tenant.timezone, 2);
    const monthBuckets = listMonthsInPeriod(tenant.timezone, 2);

    const [totals, monthlyBreakdown] = await Promise.all([
      fetchBookingTotals(this.dataSource, tenantId, period.start, period.end),
      fetchMonthlyBreakdown(
        this.dataSource,
        tenantId,
        tenant.timezone,
        period.start,
        period.end,
        monthBuckets,
      ),
    ]);

    return {
      period,
      revenue: totals.revenue,
      confirmedBookings: totals.confirmedBookings,
      cancelledBookings: totals.cancelledBookings,
      monthlyBreakdown,
      insights: null,
    };
  }
}
