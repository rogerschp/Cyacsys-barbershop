import { Injectable } from '@nestjs/common';
import { DashboardSummaryDto } from '../dto/dashboard-summary.dto';
import { RevenueCalculator } from './revenue.calculator';

export interface DashboardInput {
  revenue: number;
  confirmedBookings: number;
  cancelledBookings: number;
  newCustomers: number;
  returningCustomers: number;
}

@Injectable()
export class DashboardMetricsService {
  constructor(private readonly revenueCalculator: RevenueCalculator) {}

  build(input: DashboardInput): DashboardSummaryDto {
    const derived = this.revenueCalculator.fromTotals(input);
    return {
      revenue: input.revenue,
      confirmedBookings: input.confirmedBookings,
      cancelledBookings: input.cancelledBookings,
      cancellationRate: derived.cancellationRate,
      averageTicket: derived.averageTicket,
      newCustomers: input.newCustomers,
      returningCustomers: input.returningCustomers,
    };
  }
}
