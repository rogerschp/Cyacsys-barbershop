import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { QueryFailedError } from 'typeorm';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import {
  TENANT_PROFESSIONAL_REPOSITORY,
  ITenantProfessionalRepository,
} from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../../availability/utils/assert-tenant-professional-agenda-access';
import { BookingEntity } from '../entities/booking.entity';
import { BookingStatus } from '../entities/booking-status.enum';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';

@Injectable()
export class ConfirmBookingUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    bookingId: string,
    userId: string,
    callerRole?: string,
  ): Promise<BookingEntity> {
    await assertTenantProfessionalAgendaAccess({
      tenantId,
      tenantProfessionalId,
      userId,
      callerRole,
      tenantProfessionalRepository: this.tenantProfessionalRepository,
    });

    const booking = await this.bookingRepository.findByIdForTenantProfessional(
      bookingId,
      tenantId,
      tenantProfessionalId,
    );
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
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
      if (e instanceof QueryFailedError) {
        const code = (
          e as QueryFailedError & {
            driverError?: { code?: string };
          }
        ).driverError?.code;
        if (code === '23505') {
          throw new BusinessRuleException(
            'SLOT_NOT_AVAILABLE',
            'Outro agendamento ocupou este horário.',
          );
        }
      }
      throw e;
    }
  }
}
