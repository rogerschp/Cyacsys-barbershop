import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProfessionalMetricsDto } from '../dto/professional-metrics.dto';
import { fetchProfessionalBreakdownRaw } from '../utils/report-query.utils';
import { RevenueCalculator } from './revenue.calculator';

@Injectable()
export class ProfessionalMetricsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly revenueCalculator: RevenueCalculator,
  ) {}

  async breakdown(
    tenantId: string,
    start: Date,
    end: Date,
  ): Promise<ProfessionalMetricsDto[]> {
    const rows = await fetchProfessionalBreakdownRaw(
      this.dataSource,
      tenantId,
      start,
      end,
    );

    return rows.map((row) => {
      const derived = this.revenueCalculator.fromTotals(row);
      return {
        tenantProfessionalId: row.tenantProfessionalId,
        professionalName: row.professionalName,
        revenue: row.revenue,
        confirmedBookings: row.confirmedBookings,
        cancelledBookings: row.cancelledBookings,
        averageTicket: derived.averageTicket,
        cancellationRate: derived.cancellationRate,
      };
    });
  }
}
