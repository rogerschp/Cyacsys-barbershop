import { BookingEntity } from '../entities/booking.entity';
import { BookingStatus } from '../entities/booking-status.enum';

export interface CreateBookingDraftData {
  tenantId: string;
  tenantProfessionalId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  createdByTenantUserId: string | null;
}

export interface IBookingRepository {
  createDraft(data: CreateBookingDraftData): Promise<BookingEntity>;
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
}

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');
