import { DataSource } from 'typeorm';
import { BookingStatus } from '../../booking/entities/booking-status.enum';
import { MonthlyMetricsDto } from '../dto/monthly-metrics.dto';
import { ProfessionalMetricsDto } from '../dto/professional-metrics.dto';
import { MonthBucket } from './report-period.utils';

export interface BookingTotals {
  revenue: number;
  confirmedBookings: number;
  cancelledBookings: number;
}

interface RawMonthlyRow {
  year: string;
  month: string;
  revenue: string;
  confirmed_bookings: string;
  cancelled_bookings: string;
}

interface RawProfessionalRow {
  tenant_professional_id: string;
  professional_name: string;
  revenue: string;
  confirmed_bookings: string;
  cancelled_bookings: string;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return Number(value);
}

export async function fetchBookingTotals(
  dataSource: DataSource,
  tenantId: string,
  start: Date,
  end: Date,
): Promise<BookingTotals> {
  const [row] = await dataSource.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN b.status = $4 THEN s.price::numeric ELSE 0 END), 0) AS revenue,
      COUNT(CASE WHEN b.status = $4 THEN 1 END)::int AS confirmed_bookings,
      COUNT(CASE WHEN b.status = $5 THEN 1 END)::int AS cancelled_bookings
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.tenant_id = $1
      AND b.created_at BETWEEN $2 AND $3
    `,
    [tenantId, start, end, BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  );

  return {
    revenue: toNumber(row?.revenue),
    confirmedBookings: toNumber(row?.confirmed_bookings),
    cancelledBookings: toNumber(row?.cancelled_bookings),
  };
}

export async function fetchMonthlyBreakdown(
  dataSource: DataSource,
  tenantId: string,
  timezone: string,
  start: Date,
  end: Date,
  monthBuckets: MonthBucket[],
): Promise<MonthlyMetricsDto[]> {
  const rows: RawMonthlyRow[] = await dataSource.query(
    `
    SELECT
      EXTRACT(YEAR FROM date_trunc('month', timezone($4, b.created_at)))::int AS year,
      EXTRACT(MONTH FROM date_trunc('month', timezone($4, b.created_at)))::int AS month,
      COALESCE(SUM(CASE WHEN b.status = $5 THEN s.price::numeric ELSE 0 END), 0) AS revenue,
      COUNT(CASE WHEN b.status = $5 THEN 1 END)::int AS confirmed_bookings,
      COUNT(CASE WHEN b.status = $6 THEN 1 END)::int AS cancelled_bookings
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.tenant_id = $1
      AND b.created_at BETWEEN $2 AND $3
    GROUP BY year, month
    ORDER BY year, month
    `,
    [
      tenantId,
      start,
      end,
      timezone,
      BookingStatus.CONFIRMED,
      BookingStatus.CANCELLED,
    ],
  );

  const byKey = new Map<string, RawMonthlyRow>();
  for (const row of rows) {
    byKey.set(`${row.year}-${row.month}`, row);
  }

  const metrics = monthBuckets.map((bucket) => {
    const key = `${bucket.year}-${bucket.month}`;
    const row = byKey.get(key);
    return {
      year: bucket.year,
      month: bucket.month,
      revenue: toNumber(row?.revenue),
      confirmedBookings: toNumber(row?.confirmed_bookings),
      cancelledBookings: toNumber(row?.cancelled_bookings),
      revenueChangePercent: null as number | null,
    };
  });

  return applyRevenueChangePercent(metrics);
}

export function applyRevenueChangePercent(
  metrics: MonthlyMetricsDto[],
): MonthlyMetricsDto[] {
  return metrics.map((metric, index) => {
    if (index === 0) {
      return { ...metric, revenueChangePercent: null };
    }

    const previousRevenue = metrics[index - 1].revenue;
    if (previousRevenue === 0) {
      return { ...metric, revenueChangePercent: null };
    }

    const change = ((metric.revenue - previousRevenue) / previousRevenue) * 100;
    return {
      ...metric,
      revenueChangePercent: Math.round(change * 100) / 100,
    };
  });
}

export async function fetchProfessionalBreakdown(
  dataSource: DataSource,
  tenantId: string,
  start: Date,
  end: Date,
): Promise<ProfessionalMetricsDto[]> {
  const rows: RawProfessionalRow[] = await dataSource.query(
    `
    SELECT
      tp.id AS tenant_professional_id,
      pp.display_name AS professional_name,
      COALESCE(SUM(CASE WHEN b.status = $4 THEN s.price::numeric ELSE 0 END), 0) AS revenue,
      COUNT(CASE WHEN b.status = $4 THEN 1 END)::int AS confirmed_bookings,
      COUNT(CASE WHEN b.status = $5 THEN 1 END)::int AS cancelled_bookings
    FROM bookings b
    JOIN tenant_professionals tp ON b.tenant_professional_id = tp.id
    JOIN professional_profiles pp ON tp.professional_profile_id = pp.id
    JOIN services s ON b.service_id = s.id
    WHERE b.tenant_id = $1
      AND b.created_at BETWEEN $2 AND $3
    GROUP BY tp.id, pp.display_name
    ORDER BY revenue DESC
    `,
    [tenantId, start, end, BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  );

  return rows.map((row) => ({
    tenantProfessionalId: row.tenant_professional_id,
    professionalName: row.professional_name,
    revenue: toNumber(row.revenue),
    confirmedBookings: toNumber(row.confirmed_bookings),
    cancelledBookings: toNumber(row.cancelled_bookings),
  }));
}
