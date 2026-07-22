import { DataSource } from 'typeorm';
import {
  applyRevenueChangePercent,
  fetchBookingTotals,
  fetchCustomerCounts,
  fetchMonthlyBreakdown,
  fetchProfessionalBreakdown,
  fetchTopServices,
} from 'src/modules/report/utils/report-query.utils';
import { REVENUE_BOOKING_STATUS } from 'src/modules/report/domain/report-booking-status.policy';

describe('report-query.utils', () => {
  const tenantId = 'tenant-1';
  const start = new Date('2026-04-01T03:00:00.000Z');
  const end = new Date('2026-06-04T23:59:59.999Z');
  let dataSource: { query: jest.Mock };

  beforeEach(() => {
    dataSource = { query: jest.fn() };
  });

  describe('fetchBookingTotals', () => {
    it('usa starts_at e status de receita centralizado', async () => {
      dataSource.query.mockResolvedValue([
        {
          revenue: '1500.50',
          confirmed_bookings: '10',
          cancelled_bookings: '2',
        },
      ]);

      const result = await fetchBookingTotals(
        dataSource as unknown as DataSource,
        tenantId,
        start,
        end,
      );

      expect(result).toEqual({
        revenue: 1500.5,
        confirmedBookings: 10,
        cancelledBookings: 2,
      });
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('b.starts_at BETWEEN'),
        expect.arrayContaining([
          tenantId,
          start,
          end,
          REVENUE_BOOKING_STATUS,
        ]),
      );
      expect(dataSource.query.mock.calls[0][0]).not.toContain('createdAt');
    });

    it('retorna zero quando query não retorna linhas', async () => {
      dataSource.query.mockResolvedValue([]);

      const result = await fetchBookingTotals(
        dataSource as unknown as DataSource,
        tenantId,
        start,
        end,
      );

      expect(result).toEqual({
        revenue: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
      });
    });
  });

  describe('fetchTopServices', () => {
    it('mapeia top 5 serviços ordenados por quantidade', async () => {
      dataSource.query.mockResolvedValue([
        {
          service_id: 's1',
          service_name: 'Corte',
          quantity: '12',
          revenue: '600',
        },
      ]);

      const result = await fetchTopServices(
        dataSource as unknown as DataSource,
        tenantId,
        start,
        end,
        5,
      );

      expect(result).toEqual([
        {
          serviceId: 's1',
          serviceName: 'Corte',
          quantity: 12,
          revenue: 600,
        },
      ]);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY quantity DESC'),
        expect.arrayContaining([tenantId, start, end, REVENUE_BOOKING_STATUS, 5]),
      );
    });
  });

  describe('fetchCustomerCounts', () => {
    it('retorna novos e recorrentes', async () => {
      dataSource.query.mockResolvedValue([
        { new_customers: '4', returning_customers: '2' },
      ]);

      const result = await fetchCustomerCounts(
        dataSource as unknown as DataSource,
        tenantId,
        start,
        end,
      );

      expect(result).toEqual({ newCustomers: 4, returningCustomers: 2 });
      expect(dataSource.query.mock.calls[0][0]).toContain('guest:');
      expect(dataSource.query.mock.calls[0][0]).toContain('user:');
    });
  });

  describe('applyRevenueChangePercent', () => {
    it('null no primeiro mês e quando anterior é zero', () => {
      const result = applyRevenueChangePercent([
        {
          year: 2026,
          month: 4,
          revenue: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          revenueChangePercent: null,
        },
        {
          year: 2026,
          month: 5,
          revenue: 100,
          confirmedBookings: 2,
          cancelledBookings: 0,
          revenueChangePercent: null,
        },
        {
          year: 2026,
          month: 6,
          revenue: 150,
          confirmedBookings: 3,
          cancelledBookings: 1,
          revenueChangePercent: null,
        },
      ]);

      expect(result[0].revenueChangePercent).toBeNull();
      expect(result[1].revenueChangePercent).toBeNull();
      expect(result[2].revenueChangePercent).toBe(50);
    });
  });

  describe('fetchMonthlyBreakdown', () => {
    it('preenche buckets vazios e usa starts_at', async () => {
      dataSource.query.mockResolvedValue([
        {
          year: '2026',
          month: '5',
          revenue: '200',
          confirmed_bookings: '4',
          cancelled_bookings: '1',
        },
      ]);

      const result = await fetchMonthlyBreakdown(
        dataSource as unknown as DataSource,
        tenantId,
        'America/Sao_Paulo',
        start,
        end,
        [
          { year: 2026, month: 4 },
          { year: 2026, month: 5 },
        ],
      );

      expect(dataSource.query.mock.calls[0][0]).toContain('b.starts_at');
      expect(result[0].revenue).toBe(0);
      expect(result[1].revenue).toBe(200);
    });
  });

  describe('fetchProfessionalBreakdown', () => {
    it('inclui ticket médio e taxa de cancelamento', async () => {
      dataSource.query.mockResolvedValue([
        {
          tenant_professional_id: 'tp-1',
          professional_name: 'João',
          revenue: '1000',
          confirmed_bookings: '10',
          cancelled_bookings: '2',
        },
      ]);

      const result = await fetchProfessionalBreakdown(
        dataSource as unknown as DataSource,
        tenantId,
        start,
        end,
      );

      expect(result[0]).toMatchObject({
        tenantProfessionalId: 'tp-1',
        professionalName: 'João',
        revenue: 1000,
        confirmedBookings: 10,
        cancelledBookings: 2,
        averageTicket: 100,
        cancellationRate: 16.67,
      });
    });
  });
});
