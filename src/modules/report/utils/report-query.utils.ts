import { DataSource } from 'typeorm';
import { MonthlyMetricsDto } from '../dto/monthly-metrics.dto';
import { ProfessionalMetricsDto } from '../dto/professional-metrics.dto';
import { TopServiceMetricsDto } from '../dto/top-service-metrics.dto';
import {
  CANCELLED_BOOKING_STATUS,
  REVENUE_BOOKING_STATUS,
} from '../domain/report-booking-status.policy';
import { MonthBucket } from './report-period.utils';

export interface BookingTotals {
  revenue: number;
  confirmedBookings: number;
  cancelledBookings: number;
}

export interface CustomerCounts {
  newCustomers: number;
  returningCustomers: number;
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

interface RawTopServiceRow {
  service_id: string;
  service_name: string;
  quantity: string;
  revenue: string;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return Number(value);
}

/** Expressão SQL de identidade do cliente (USER ou GUEST). */
export const CUSTOMER_IDENTITY_SQL = `CASE
  WHEN b.client_user_id IS NOT NULL THEN 'user:' || b.client_user_id::text
  WHEN b.guest_phone IS NOT NULL THEN 'guest:' || b.guest_phone
  ELSE NULL
END`;

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
      AND b.starts_at BETWEEN $2 AND $3
    `,
    [tenantId, start, end, REVENUE_BOOKING_STATUS, CANCELLED_BOOKING_STATUS],
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
      EXTRACT(YEAR FROM date_trunc('month', timezone($4, b.starts_at)))::int AS year,
      EXTRACT(MONTH FROM date_trunc('month', timezone($4, b.starts_at)))::int AS month,
      COALESCE(SUM(CASE WHEN b.status = $5 THEN s.price::numeric ELSE 0 END), 0) AS revenue,
      COUNT(CASE WHEN b.status = $5 THEN 1 END)::int AS confirmed_bookings,
      COUNT(CASE WHEN b.status = $6 THEN 1 END)::int AS cancelled_bookings
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.tenant_id = $1
      AND b.starts_at BETWEEN $2 AND $3
    GROUP BY year, month
    ORDER BY year, month
    `,
    [
      tenantId,
      start,
      end,
      timezone,
      REVENUE_BOOKING_STATUS,
      CANCELLED_BOOKING_STATUS,
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

export async function fetchProfessionalBreakdownRaw(
  dataSource: DataSource,
  tenantId: string,
  start: Date,
  end: Date,
): Promise<
  Array<{
    tenantProfessionalId: string;
    professionalName: string;
    revenue: number;
    confirmedBookings: number;
    cancelledBookings: number;
  }>
> {
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
      AND b.starts_at BETWEEN $2 AND $3
    GROUP BY tp.id, pp.display_name
    ORDER BY revenue DESC
    `,
    [tenantId, start, end, REVENUE_BOOKING_STATUS, CANCELLED_BOOKING_STATUS],
  );

  return rows.map((row) => ({
    tenantProfessionalId: row.tenant_professional_id,
    professionalName: row.professional_name,
    revenue: toNumber(row.revenue),
    confirmedBookings: toNumber(row.confirmed_bookings),
    cancelledBookings: toNumber(row.cancelled_bookings),
  }));
}

export async function fetchTopServices(
  dataSource: DataSource,
  tenantId: string,
  start: Date,
  end: Date,
  limit = 5,
): Promise<TopServiceMetricsDto[]> {
  const rows: RawTopServiceRow[] = await dataSource.query(
    `
    SELECT
      s.id AS service_id,
      s.name AS service_name,
      COUNT(*)::int AS quantity,
      COALESCE(SUM(s.price::numeric), 0) AS revenue
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.tenant_id = $1
      AND b.status = $4
      AND b.starts_at BETWEEN $2 AND $3
    GROUP BY s.id, s.name
    ORDER BY quantity DESC, revenue DESC
    LIMIT $5
    `,
    [tenantId, start, end, REVENUE_BOOKING_STATUS, limit],
  );

  return rows.map((row) => ({
    serviceId: row.service_id,
    serviceName: row.service_name,
    quantity: toNumber(row.quantity),
    revenue: toNumber(row.revenue),
  }));
}

export async function fetchCustomerCounts(
  dataSource: DataSource,
  tenantId: string,
  start: Date,
  end: Date,
): Promise<CustomerCounts> {
  const [row] = await dataSource.query(
    `
    WITH identified AS (
      SELECT
        ${CUSTOMER_IDENTITY_SQL} AS identity_key,
        b.starts_at
      FROM bookings b
      WHERE b.tenant_id = $1
        AND b.status = $4
        AND (
          b.client_user_id IS NOT NULL
          OR b.guest_phone IS NOT NULL
        )
    ),
    first_visit AS (
      SELECT identity_key, MIN(starts_at) AS first_starts_at
      FROM identified
      WHERE identity_key IS NOT NULL
      GROUP BY identity_key
    ),
    in_period AS (
      SELECT DISTINCT identity_key
      FROM identified
      WHERE identity_key IS NOT NULL
        AND starts_at BETWEEN $2 AND $3
    ),
    before_period AS (
      SELECT DISTINCT identity_key
      FROM identified
      WHERE identity_key IS NOT NULL
        AND starts_at < $2
    )
    SELECT
      (
        SELECT COUNT(*)::int
        FROM first_visit
        WHERE first_starts_at BETWEEN $2 AND $3
      ) AS new_customers,
      (
        SELECT COUNT(*)::int
        FROM in_period i
        INNER JOIN before_period b ON b.identity_key = i.identity_key
      ) AS returning_customers
    `,
    [tenantId, start, end, REVENUE_BOOKING_STATUS],
  );

  return {
    newCustomers: toNumber(row?.new_customers),
    returningCustomers: toNumber(row?.returning_customers),
  };
}

/** @deprecated Prefer ProfessionalMetricsService — mantido para testes legados de query. */
export async function fetchProfessionalBreakdown(
  dataSource: DataSource,
  tenantId: string,
  start: Date,
  end: Date,
): Promise<ProfessionalMetricsDto[]> {
  const rows = await fetchProfessionalBreakdownRaw(
    dataSource,
    tenantId,
    start,
    end,
  );
  return rows.map((row) => {
    const denominator = row.confirmedBookings + row.cancelledBookings;
    return {
      ...row,
      averageTicket:
        row.confirmedBookings > 0
          ? Math.round((row.revenue / row.confirmedBookings) * 100) / 100
          : 0,
      cancellationRate:
        denominator > 0
          ? Math.round((row.cancelledBookings / denominator) * 10000) / 100
          : 0,
    };
  });
}
