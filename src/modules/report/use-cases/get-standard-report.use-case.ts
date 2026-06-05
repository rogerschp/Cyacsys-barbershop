import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { StandardReportDto } from '../dto/standard-report.dto';
import { getReportPeriod } from '../utils/report-period.utils';
import { fetchBookingTotals } from '../utils/report-query.utils';

@Injectable()
export class GetStandardReportUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(tenantId: string): Promise<StandardReportDto> {
    const tenant = await this.findTenantByIdUseCase.run(tenantId);
    const period = getReportPeriod(tenant.timezone, 0);
    const totals = await fetchBookingTotals(
      this.dataSource,
      tenantId,
      period.start,
      period.end,
    );

    return {
      period,
      revenue: totals.revenue,
      confirmedBookings: totals.confirmedBookings,
      cancelledBookings: totals.cancelledBookings,
      insights: null,
    };
  }
}
