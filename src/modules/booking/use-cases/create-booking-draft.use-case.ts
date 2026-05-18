import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { QueryFailedError } from 'typeorm';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '../../service/interfaces/service-repository.interface';
import { FindTenantUserByIdAndTenantUseCase } from '../../tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { ValidateMembershipByUserIdAndTenantIdUseCase } from '../../tenant-user/use-cases/validate-membership-by-userId-and-tenantId.use-case';
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
import { BOOKING_MIN_LEAD_MINUTES } from '../booking-lead.constants';
@Injectable()
export class CreateBookingDraftUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    private readonly findTenantUserByIdAndTenantUseCase: FindTenantUserByIdAndTenantUseCase,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    private readonly validateMembershipByUserIdAndTenantIdUseCase: ValidateMembershipByUserIdAndTenantIdUseCase,
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
      findTenantUserByIdAndTenant: this.findTenantUserByIdAndTenantUseCase,
    });
    const tenant = await this.findTenantByIdUseCase.run(tenantId);
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
    if (slotStartUtc <= nowUtc) {
      throw new BusinessRuleException(
        'BOOKING_IN_THE_PAST',
        'O horário de início precisa ser no futuro (não pode ser agora ou no passado).',
      );
    }
    const earliestBookableUtc = nowUtc.plus({
      minutes: BOOKING_MIN_LEAD_MINUTES,
    });
    if (slotStartUtc < earliestBookableUtc) {
      throw new BusinessRuleException(
        'BOOKING_MIN_LEAD_NOT_MET',
        `É necessário agendar com pelo menos ${BOOKING_MIN_LEAD_MINUTES} minutos de antecedência.`,
      );
    }
    const endsAtUtc = slotStartUtc.plus({ minutes: service.durationInMinutes });
    const membership =
      await this.validateMembershipByUserIdAndTenantIdUseCase.run(
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
          e as QueryFailedError & {
            driverError?: {
              code?: string;
            };
          }
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
