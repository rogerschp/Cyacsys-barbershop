import { Injectable } from '@nestjs/common';

export interface RevenueTotalsInput {
  revenue: number;
  completedBookings: number;
  cancelledBookings: number;
}

@Injectable()
export class RevenueCalculator {
  averageTicket(revenue: number, completedBookings: number): number {
    if (completedBookings <= 0) {
      return 0;
    }
    return Math.round((revenue / completedBookings) * 100) / 100;
  }

  cancellationRate(
    completedBookings: number,
    cancelledBookings: number,
  ): number {
    const denominator = completedBookings + cancelledBookings;
    if (denominator <= 0) {
      return 0;
    }
    return Math.round((cancelledBookings / denominator) * 10000) / 100;
  }

  fromTotals(input: RevenueTotalsInput): {
    averageTicket: number;
    cancellationRate: number;
  } {
    return {
      averageTicket: this.averageTicket(input.revenue, input.completedBookings),
      cancellationRate: this.cancellationRate(
        input.completedBookings,
        input.cancelledBookings,
      ),
    };
  }
}
