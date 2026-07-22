import { BookingEntity } from '../entities/booking.entity';
import { BookingResponseDto } from '../dto/booking-response.dto';

export function mapBookingToResponse(
  booking: BookingEntity,
): BookingResponseDto {
  return {
    id: booking.id,
    tenantId: booking.tenantId,
    tenantProfessionalId: booking.tenantProfessionalId,
    serviceId: booking.serviceId,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    status: booking.status,
    clientUserId: booking.clientUserId,
    guestName: booking.guestName ?? null,
    guestPhone: booking.guestPhone ?? null,
    guestEmail: booking.guestEmail ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}
