import { BookingEntity } from '../entities/booking.entity';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';

export function assertBookingOwnedByClient(
  booking: BookingEntity,
  userId: string,
): void {
  if (booking.clientUserId !== userId) {
    throw new TenantForbiddenException(
      'BOOKING_NOT_OWNED',
      'Você só pode alterar o próprio agendamento.',
      { tenantId: booking.tenantId },
    );
  }
}
