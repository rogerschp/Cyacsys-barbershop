import { BookingEntity } from '../entities/booking.entity';
import { BookingStatus } from '../entities/booking-status.enum';
import { CustomerIdentity } from '../domain/customer-identity';

export interface CreateBookingDraftData {
  tenantId: string;
  tenantProfessionalId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  createdByTenantUserId: string | null;
  clientUserId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
}

export interface ListBookingsByClientUserOptions {
  status?: BookingStatus;
}

export interface ListOpsBookingsQuery {
  tenantId: string;
  tenantProfessionalId?: string;
  rangeStart?: Date;
  rangeEnd?: Date;
  status?: BookingStatus;
}

export interface ActiveBookingTimeRange {
  startsAt: Date;
  endsAt: Date;
}

export interface CustomerActiveQuery {
  tenantId: string;
  identity: CustomerIdentity;
  excludeBookingId?: string;
}

export interface CustomerTimeOverlapQuery extends CustomerActiveQuery {
  startsAt: Date;
  endsAt: Date;
}

export interface IBookingRepository {
  findActiveByTenantProfessionalBetween(
    tenantId: string,
    tenantProfessionalId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<ActiveBookingTimeRange[]>;
  createDraft(data: CreateBookingDraftData): Promise<BookingEntity>;
  findByClientUserId(
    clientUserId: string,
    options?: ListBookingsByClientUserOptions,
  ): Promise<BookingEntity[]>;
  findByIdForTenantProfessional(
    id: string,
    tenantId: string,
    tenantProfessionalId: string,
  ): Promise<BookingEntity | null>;
  updateStatus(
    id: string,
    tenantId: string,
    tenantProfessionalId: string,
    expectedStatus: BookingStatus,
    newStatus: BookingStatus,
  ): Promise<BookingEntity>;
  findActiveCustomerTimeOverlap(
    query: CustomerTimeOverlapQuery,
  ): Promise<ActiveBookingTimeRange | null>;
  countActiveByCustomerIdentity(query: CustomerActiveQuery): Promise<number>;
  listOpsBookings(query: ListOpsBookingsQuery): Promise<BookingEntity[]>;
}

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');
