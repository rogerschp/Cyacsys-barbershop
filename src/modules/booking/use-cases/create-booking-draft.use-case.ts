import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { QueryFailedError } from 'typeorm';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantService } from '../../tenant/tenant.service';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '../../service/interfaces/service-repository.interface';
import { TenantUserService } from '../../tenant-user/tenant-user.service';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { GetAvailableSlotsUseCase } from '../../availability/use-cases/get-available-slots.use-case';
import { CreateBookingDraftDto } from '../dto/create-booking-draft.dto';
import { BookingEntity } from '../entities/booking.entity';
import {
  BOOKING_REPOSITORY,
  IBookingRepository,
} from '../interfaces/booking-repository.interface';
import { assertBarberAgendaAccess } from '../../availability/utils/assert-barber-agenda-access';

@Injectable()
export class CreateBookingDraftUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    private readonly tenantUserService: TenantUserService,
    private readonly tenantService: TenantService,
    private readonly getAvailableSlotsUseCase: GetAvailableSlotsUseCase,
  ) {}

  async run(
    tenantId: string,
    barberProfileId: string,
    dto: CreateBookingDraftDto,
    userId: string,
    callerRole?: string,
  ): Promise<BookingEntity> {
    await assertBarberAgendaAccess({
      tenantId,
      barberProfileId,
      userId,
      callerRole,
      barberProfileRepository: this.barberProfileRepository,
      tenantUserService: this.tenantUserService,
    });

    const tenant = await this.tenantService.findById(tenantId);
    const timezone = tenant.timezone || 'America/Sao_Paulo';

    const barber = await this.barberProfileRepository.findById(
      barberProfileId,
      tenantId,
    );
    if (!barber) {
      throw new NotFoundException('Barber profile not found');
    }
    if (!barber.isActive) {
      throw new BusinessRuleException(
        'BARBER_INACTIVE',
        'Barbeiro inativo não recebe agendamentos.',
      );
    }

    const service = await this.serviceRepository.findById(
      dto.serviceId,
      tenantId,
    );
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (!service.isActive) {
      throw new BusinessRuleException(
        'SERVICE_INACTIVE',
        'Serviço inativo não pode ser agendado.',
      );
    }

    const available = await this.getAvailableSlotsUseCase.run(
      tenantId,
      barberProfileId,
      dto.serviceId,
      dto.date,
      userId,
      callerRole,
    );

    if (!available.slots.includes(dto.startTime)) {
      throw new BusinessRuleException(
        'SLOT_NOT_AVAILABLE',
        'Este horário não está disponível para o serviço escolhido.',
      );
    }

    const slotStartUtc = DateTime.fromFormat(
      `${dto.date} ${dto.startTime}`,
      'yyyy-MM-dd HH:mm',
      { zone: timezone },
    ).toUTC();

    if (!slotStartUtc.isValid) {
      throw new BusinessRuleException(
        'INVALID_SLOT',
        'Data ou horário de início inválidos para o fuso do tenant.',
      );
    }

    const nowUtc = DateTime.now().toUTC();
    if (slotStartUtc < nowUtc) {
      throw new BusinessRuleException(
        'BOOKING_IN_THE_PAST',
        'Não é possível agendar um horário que já passou.',
      );
    }

    const endsAtUtc = slotStartUtc.plus({ minutes: service.durationInMinutes });

    const membership = await this.tenantUserService.validateMembership(
      userId,
      tenantId,
    );
    const createdByTenantUserId = membership.id;

    try {
      return await this.bookingRepository.createDraft({
        tenantId,
        barberProfileId,
        serviceId: dto.serviceId,
        startsAt: slotStartUtc.toJSDate(),
        endsAt: endsAtUtc.toJSDate(),
        createdByTenantUserId,
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'BOOKING_SLOT_CONFLICT') {
        throw new BusinessRuleException(
          'SLOT_NOT_AVAILABLE',
          'Este horário já está reservado ou em rascunho para o barbeiro.',
        );
      }
      if (e instanceof QueryFailedError) {
        const code = (
          e as QueryFailedError & { driverError?: { code?: string } }
        ).driverError?.code;
        if (code === '23505') {
          throw new BusinessRuleException(
            'SLOT_NOT_AVAILABLE',
            'Este horário já está reservado ou em rascunho para o barbeiro.',
          );
        }
      }
      throw e;
    }
  }
}
