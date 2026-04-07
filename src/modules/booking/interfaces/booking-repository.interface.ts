import { BookingEntity } from '../entities/booking.entity';
import { BookingStatus } from '../entities/booking-status.enum';

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');

export interface CreateBookingDraftData {
  tenantId: string;
  barberProfileId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  createdByTenantUserId: string | null;
}

export interface IBookingRepository {
  createDraft(data: CreateBookingDraftData): Promise<BookingEntity>;

  findByIdForBarber(
    id: string,
    tenantId: string,
    barberProfileId: string,
  ): Promise<BookingEntity | null>;

  updateStatus(
    id: string,
    tenantId: string,
    barberProfileId: string,
    expectedStatus: BookingStatus,
    newStatus: BookingStatus,
  ): Promise<BookingEntity>;
}
