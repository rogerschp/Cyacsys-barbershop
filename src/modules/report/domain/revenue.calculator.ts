import { Injectable } from '@nestjs/common';

export interface RevenueTotalsInput {
  revenue: number;
  confirmedBookings: number;
  cancelledBookings: number;
}

@Injectable()
export class RevenueCalculator {
  averageTicket(revenue: number, confirmedBookings: number): number {
    if (confirmedBookings <= 0) {
      return 0;
    }
    return Math.round((revenue / confirmedBookings) * 100) / 100;
  }

  cancellationRate(
    confirmedBookings: number,
    cancelledBookings: number,
  ): number {
    const denominator = confirmedBookings + cancelledBookings;
    if (denominator <= 0) {
      return 0;
    }
    return (
      Math.round((cancelledBookings / denominator) * 10000) / 100
    );
  }

  fromTotals(input: RevenueTotalsInput): {
    averageTicket: number;
    cancellationRate: number;
  } {
    return {
      averageTicket: this.averageTicket(
        input.revenue,
        input.confirmedBookings,
      ),
      cancellationRate: this.cancellationRate(
        input.confirmedBookings,
        input.cancelledBookings,
      ),
    };
  }
}
