import { DateTime } from 'luxon';
import { BookingEntity } from '../entities/booking.entity';
import { OpsBookingResponseDto } from '../dto/ops-booking-response.dto';

export function mapBookingToOpsResponse(
  booking: BookingEntity,
  timezone: string,
): OpsBookingResponseDto {
  const tz = timezone || 'America/Sao_Paulo';
  const startLocal = DateTime.fromJSDate(booking.startsAt, {
    zone: 'utc',
  }).setZone(tz);
  const endLocal = DateTime.fromJSDate(booking.endsAt, { zone: 'utc' }).setZone(
    tz,
  );

  const isUser = Boolean(booking.clientUserId);

  return {
    id: booking.id,
    status: booking.status,
    date: startLocal.toFormat('yyyy-MM-dd'),
    startTime: startLocal.toFormat('HH:mm'),
    endTime: endLocal.toFormat('HH:mm'),
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    professional: {
      tenantProfessionalId: booking.tenantProfessionalId,
      displayName:
        booking.tenantProfessional?.professionalProfile?.displayName ?? '',
    },
    service: {
      id: booking.serviceId,
      name: booking.service?.name ?? '',
      durationInMinutes: booking.service?.durationInMinutes ?? 0,
    },
    customer: {
      kind: isUser ? 'USER' : 'GUEST',
      clientUserId: booking.clientUserId ?? null,
      guestName: booking.guestName ?? null,
      guestPhone: booking.guestPhone ?? null,
      guestEmail: booking.guestEmail ?? null,
    },
  };
}
