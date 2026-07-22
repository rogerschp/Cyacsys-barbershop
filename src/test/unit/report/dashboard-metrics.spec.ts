import { RevenueCalculator } from 'src/modules/report/domain/revenue.calculator';
import { DashboardMetricsService } from 'src/modules/report/domain/dashboard-metrics.service';

describe('RevenueCalculator', () => {
  const calculator = new RevenueCalculator();

  it('calcula ticket médio', () => {
    expect(calculator.averageTicket(1000, 4)).toBe(250);
    expect(calculator.averageTicket(100, 3)).toBe(33.33);
    expect(calculator.averageTicket(500, 0)).toBe(0);
  });

  it('calcula taxa de cancelamento', () => {
    expect(calculator.cancellationRate(95, 5)).toBe(5);
    expect(calculator.cancellationRate(0, 0)).toBe(0);
    expect(calculator.cancellationRate(1, 1)).toBe(50);
  });
});

describe('DashboardMetricsService', () => {
  it('monta summary com KPIs derivados', () => {
    const service = new DashboardMetricsService(new RevenueCalculator());
    const dashboard = service.build({
      revenue: 1000,
      confirmedBookings: 10,
      cancelledBookings: 2,
      newCustomers: 3,
      returningCustomers: 4,
    });

    expect(dashboard).toEqual({
      revenue: 1000,
      confirmedBookings: 10,
      cancelledBookings: 2,
      cancellationRate: 16.67,
      averageTicket: 100,
      newCustomers: 3,
      returningCustomers: 4,
    });
  });
});
