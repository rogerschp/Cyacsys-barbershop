import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { CreateTimeOffDto } from '../dto/create-time-off.dto';
import { TimeOffEntity } from '../entities/time-off.entity';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { normalizeTimeOffTimes } from '../utils/validate-time-off-range';
@Injectable()
export class CreateTimeOffUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}
  async run(
    tenantId: string,
    tenantProfessionalId: string,
    dto: CreateTimeOffDto,
    userId: string,
    callerRole?: string,
  ): Promise<TimeOffEntity> {
    await assertTenantProfessionalAgendaAccess({
      tenantId,
      tenantProfessionalId,
      userId,
      callerRole,
      tenantProfessionalRepository: this.tenantProfessionalRepository,
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
      tenantProfessionalId,
      date: dto.date,
      startTime: norm.startTime,
      endTime: norm.endTime,
      reason: dto.reason,
    });
  }
}
