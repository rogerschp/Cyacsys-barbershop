import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantUserService } from '../../tenant-user/tenant-user.service';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { CreateWorkingHoursDto } from '../dto/create-working-hours.dto';
import { WorkingHoursEntity } from '../entities/working-hours.entity';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
import { validatePeriodsNoOverlap } from '../utils/validate-periods-no-overlap';

@Injectable()
export class CreateWorkingHoursUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository,
    private readonly tenantUserService: TenantUserService,
  ) {}

  async run(
    tenantId: string,
    barberProfileId: string,
    dto: CreateWorkingHoursDto,
    userId: string,
    callerRole?: string,
  ): Promise<WorkingHoursEntity> {
    await assertBarberAgendaAccess({
      tenantId,
      barberProfileId,
      userId,
      callerRole,
      barberProfileRepository: this.barberProfileRepository,
      tenantUserService: this.tenantUserService,
    });

    const isActive = dto.isActive !== false;

    const exists =
      await this.availabilityRepository.existsOtherWorkingHoursForDay(
        barberProfileId,
        tenantId,
        dto.dayOfWeek,
      );
    if (exists) {
      throw new BusinessRuleException(
        'WORKING_HOURS_ALREADY_EXISTS',
        'Já existe jornada para este dia da semana.',
      );
    }

    if (isActive && (!dto.periods || dto.periods.length === 0)) {
      throw new BusinessRuleException(
        'WORKING_HOURS_ACTIVE_REQUIRES_PERIOD',
        'WorkingHours ativo exige pelo menos um período.',
      );
    }

    if (dto.periods?.length) {
      validatePeriodsNoOverlap(dto.periods);
    }

    const wh = await this.availabilityRepository.createWorkingHours({
      tenantId,
      barberProfileId,
      dayOfWeek: dto.dayOfWeek,
      isActive,
    });

    if (dto.periods?.length) {
      for (const p of dto.periods) {
        await this.availabilityRepository.createWorkingHoursPeriod({
          workingHoursId: wh.id,
          startTime: p.startTime,
          endTime: p.endTime,
        });
      }
    }

    return (
      (await this.availabilityRepository.findWorkingHoursById(
        wh.id,
        tenantId,
        true,
      )) ?? wh
    );
  }
}
