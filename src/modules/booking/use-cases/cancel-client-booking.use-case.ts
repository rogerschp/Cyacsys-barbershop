import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { BookingEntity } from '../entities/booking.entity';
import { BookingStatus } from '../entities/booking-status.enum';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';
import { assertBookingOwnedByClient } from '../utils/assert-booking-owned-by-client';

@Injectable()
export class CancelClientBookingUseCase {
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
        'Só é possível cancelar um rascunho.',
      );
    }

    try {
      return await this.bookingRepository.updateStatus(
        bookingId,
        tenantId,
        tenantProfessionalId,
        BookingStatus.DRAFT,
        BookingStatus.CANCELLED,
      );
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'BOOKING_INVALID_STATUS') {
        throw new BusinessRuleException(
          'BOOKING_INVALID_STATUS',
          'Só é possível cancelar um rascunho.',
        );
      }
      if (e instanceof Error && e.message === 'BOOKING_NOT_FOUND') {
        throw new NotFoundException('Booking not found');
      }
      throw e;
    }
  }
}
