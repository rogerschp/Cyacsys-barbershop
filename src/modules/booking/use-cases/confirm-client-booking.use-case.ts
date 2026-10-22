import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { NotificationEvent } from '../../notification/domain/notification-event.enum';
import { DispatchNotificationUseCase } from '../../notification/use-cases/dispatch-notification.use-case';
import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { BookingEntity } from '../entities/booking.entity';
import { BookingStatus } from '../entities/booking-status.enum';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';
import { assertBookingOwnedByClient } from '../utils/assert-booking-owned-by-client';
import { NotifyProfessionalNewBookingService } from './notify-professional-new-booking.service';

@Injectable()
export class ConfirmClientBookingUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Optional()
    private readonly dispatchNotification?: DispatchNotificationUseCase,
    @Optional()
    private readonly notifyProfessionalNewBooking?: NotifyProfessionalNewBookingService,
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

    if (booking.status !== BookingStatus.DRAFT) {
      throw new BusinessRuleException(
        'BOOKING_INVALID_STATUS',
        'Só é possível confirmar um agendamento em rascunho.',
      );
    }

    const nowUtc = DateTime.now().toUTC();
    const startUtc = DateTime.fromJSDate(booking.startsAt).toUTC();
    if (startUtc <= nowUtc) {
      throw new BusinessRuleException(
        'BOOKING_IN_THE_PAST',
        'Não é possível confirmar: o horário de início já passou ou é o instante atual.',
      );
    }

    try {
      const updated = await this.bookingRepository.updateStatus(
        bookingId,
        tenantId,
        tenantProfessionalId,
        BookingStatus.DRAFT,
        BookingStatus.CONFIRMED,
      );
      await this.notifyConfirmed(updated);
      // Novo agendamento com o profissional → Telegram/Push pra ele.
      await this.notifyProfessionalNewBooking?.run(updated);
      return updated;
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'BOOKING_SLOT_CONFLICT') {
        throw new BusinessRuleException(
          'SLOT_NOT_AVAILABLE',
          'Outro agendamento ocupou este horário. Cancele o rascunho e escolha outro slot.',
        );
      }
      if (e instanceof Error && e.message === 'BOOKING_INVALID_STATUS') {
        throw new BusinessRuleException(
          'BOOKING_INVALID_STATUS',
          'Só é possível confirmar um agendamento em rascunho.',
        );
      }
      if (e instanceof Error && e.message === 'BOOKING_NOT_FOUND') {
        throw new NotFoundException('Booking not found');
      }
      throw e;
    }
  }

  private async notifyConfirmed(booking: BookingEntity): Promise<void> {
    if (!this.dispatchNotification || !booking.clientUserId) return;
    try {
      await this.dispatchNotification.run({
        event: NotificationEvent.BOOKING_CONFIRMED,
        recipientUserId: booking.clientUserId,
        tenantId: booking.tenantId,
        idempotencyKey: `booking:${booking.id}:BOOKING_CONFIRMED`,
        payload: {
          bookingId: booking.id,
          tenantId: booking.tenantId,
          tenantProfessionalId: booking.tenantProfessionalId,
          startsAt: booking.startsAt?.toISOString?.() ?? String(booking.startsAt),
        },
      });
    } catch { /* notificação nunca derruba o booking */ }
  }
}
