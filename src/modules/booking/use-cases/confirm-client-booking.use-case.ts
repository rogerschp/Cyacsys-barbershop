import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { BookingEntity } from '../entities/booking.entity';
import { BookingStatus } from '../entities/booking-status.enum';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';
import { assertBookingOwnedByClient } from '../utils/assert-booking-owned-by-client';

@Injectable()
export class ConfirmClientBookingUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
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
      return await this.bookingRepository.updateStatus(
        bookingId,
        tenantId,
        tenantProfessionalId,
        BookingStatus.DRAFT,
        BookingStatus.CONFIRMED,
      );
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
}
