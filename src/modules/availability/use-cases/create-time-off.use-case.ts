import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindTenantUserByIdAndTenantUseCase } from '../../tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { BARBER_PROFILE_REPOSITORY } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import type { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';
import { CreateTimeOffDto } from '../dto/create-time-off.dto';
import { TimeOffEntity } from '../entities/time-off.entity';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertBarberAgendaAccess } from '../utils/assert-barber-agenda-access';
import { normalizeTimeOffTimes } from '../utils/validate-time-off-range';
@Injectable()
export class CreateTimeOffUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(BARBER_PROFILE_REPOSITORY)
    private readonly barberProfileRepository: IBarberProfileRepository,
    private readonly findTenantUserByIdAndTenantUseCase: FindTenantUserByIdAndTenantUseCase,
  ) {}
  async run(
    tenantId: string,
    barberProfileId: string,
    dto: CreateTimeOffDto,
    userId: string,
    callerRole?: string,
  ): Promise<TimeOffEntity> {
    await assertBarberAgendaAccess({
      tenantId,
      barberProfileId,
      userId,
      callerRole,
      barberProfileRepository: this.barberProfileRepository,
      findTenantUserByIdAndTenant: this.findTenantUserByIdAndTenantUseCase,
    });
    if (!DateTime.fromISO(dto.date).isValid) {
      throw new BusinessRuleException(
        'INVALID_DATE',
        'Data inválida. Use yyyy-MM-dd.',
      );
    }
    const norm = normalizeTimeOffTimes(dto.startTime, dto.endTime);
    return this.availabilityRepository.createTimeOff({
      tenantId,
      barberProfileId,
      date: dto.date,
      startTime: norm.startTime,
      endTime: norm.endTime,
      reason: dto.reason,
    });
  }
}
