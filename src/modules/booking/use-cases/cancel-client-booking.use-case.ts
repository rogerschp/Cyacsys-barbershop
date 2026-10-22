import {
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { NotificationEvent } from '../../notification/domain/notification-event.enum';
import { DispatchNotificationUseCase } from '../../notification/use-cases/dispatch-notification.use-case';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { BookingEntity } from '../entities/booking.entity';
import { BookingStatus } from '../entities/booking-status.enum';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';
import { assertBookingOwnedByClient } from '../utils/assert-booking-owned-by-client';
import { assertClientMayCancelConfirmed } from '../utils/assert-client-may-cancel-confirmed';

@Injectable()
export class CancelClientBookingUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    @Optional()
    private readonly dispatchNotification?: DispatchNotificationUseCase,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    bookingId: string,
    clientUserId: string,
  ): Promise<BookingEntity> {
    const booking = await this.bookingRepository.findByIdForTenantProfessional(
      bookingId,
      tenantId,
      tenantProfessionalId,
    );
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    assertBookingOwnedByClient(booking, clientUserId);

    if (booking.status === BookingStatus.DRAFT) {
      return this.transitionToCancelled(booking, BookingStatus.DRAFT);
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      const tenant = await this.findTenantByIdUseCase.run(tenantId);
      assertClientMayCancelConfirmed({
        clientCanCancelConfirmed: tenant.clientCanCancelConfirmed,
        clientCancelConfirmedMinLeadMinutes:
          tenant.clientCancelConfirmedMinLeadMinutes,
        startsAt: booking.startsAt,
      });
      return this.transitionToCancelled(booking, BookingStatus.CONFIRMED);
    }

    throw new BusinessRuleException(
      'BOOKING_INVALID_STATUS',
      'Só é possível cancelar rascunho ou agendamento confirmado.',
    );
  }

  private async transitionToCancelled(
    booking: BookingEntity,
    expectedStatus: BookingStatus,
  ): Promise<BookingEntity> {
    try {
      const updated = await this.bookingRepository.updateStatus(
        booking.id,
        booking.tenantId,
        booking.tenantProfessionalId,
        expectedStatus,
        BookingStatus.CANCELLED,
      );
      if (this.dispatchNotification && updated.clientUserId) {
        try {
          await this.dispatchNotification.run({
            event: NotificationEvent.BOOKING_CANCELLED,
            recipientUserId: updated.clientUserId,
            tenantId: updated.tenantId,
            idempotencyKey: `booking:${updated.id}:BOOKING_CANCELLED`,
            payload: {
              bookingId: updated.id,
              tenantId: updated.tenantId,
              tenantProfessionalId: updated.tenantProfessionalId,
              startsAt:
                updated.startsAt?.toISOString?.() ?? String(updated.startsAt),
            },
          });
        } catch {
          /* notificação nunca derruba o booking */
        }
      }
      return updated;
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'BOOKING_INVALID_STATUS') {
        throw new BusinessRuleException(
          'BOOKING_INVALID_STATUS',
          'Só é possível cancelar rascunho ou agendamento confirmado.',
        );
      }
      if (e instanceof Error && e.message === 'BOOKING_NOT_FOUND') {
        throw new NotFoundException('Booking not found');
      }
      throw e;
    }
  }
}
