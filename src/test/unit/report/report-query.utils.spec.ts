import { DataSource } from 'typeorm';
import {
  applyRevenueChangePercent,
  fetchBookingTotals,
  fetchMonthlyBreakdown,
  fetchProfessionalBreakdown,
} from 'src/modules/report/utils/report-query.utils';

describe('report-query.utils', () => {
  const tenantId = 'tenant-1';
  const start = new Date('2026-04-01T03:00:00.000Z');
  const end = new Date('2026-06-04T23:59:59.999Z');
  let dataSource: { query: jest.Mock };

  beforeEach(() => {
    dataSource = { query: jest.fn() };
  });

  describe('fetchBookingTotals', () => {
    it('mapeia totais da query', async () => {
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
        expect.stringContaining('FROM bookings b'),
        expect.arrayContaining([tenantId, start, end]),
      );
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
    it('preenche meses sem dados e calcula variação', async () => {
      dataSource.query.mockResolvedValue([
        {
          year: '2026',
          month: '5',
          revenue: '200',
          confirmed_bookings: '4',
          cancelled_bookings: '1',
        },
        {
          year: '2026',
          month: '6',
          revenue: '250',
          confirmed_bookings: '5',
          cancelled_bookings: '0',
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
          { year: 2026, month: 6 },
        ],
      );

      expect(result).toHaveLength(3);
      expect(result[0].revenue).toBe(0);
      expect(result[1].revenue).toBe(200);
      expect(result[2].revenueChangePercent).toBe(25);
    });
  });

  describe('fetchProfessionalBreakdown', () => {
    it('mapeia profissionais da query', async () => {
      dataSource.query.mockResolvedValue([
        {
          tenant_professional_id: 'tp-1',
          professional_name: 'João',
          revenue: '800',
          confirmed_bookings: '20',
          cancelled_bookings: '1',
        },
      ]);

      const result = await fetchProfessionalBreakdown(
        dataSource as unknown as DataSource,
        tenantId,
        start,
        end,
      );

      expect(result).toEqual([
        {
          tenantProfessionalId: 'tp-1',
          professionalName: 'João',
          revenue: 800,
          confirmedBookings: 20,
          cancelledBookings: 1,
        },
      ]);
    });
  });
});
