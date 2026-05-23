import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { UpdateTimeOffDto } from '../dto/update-time-off.dto';
import { TimeOffEntity } from '../entities/time-off.entity';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { normalizeDateColumn } from '../utils/time-range.utils';
import { normalizeTimeOffTimes } from '../utils/validate-time-off-range';
@Injectable()
export class UpdateTimeOffUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    timeOffId: string,
    dto: UpdateTimeOffDto,
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
    const existing = await this.availabilityRepository.findTimeOffById(
      timeOffId,
      tenantId,
    );
    if (!existing || existing.tenantProfessionalId !== tenantProfessionalId) {
      throw new NotFoundException('Time off not found');
    }
    const nextDate =
      dto.date !== undefined
        ? dto.date
        : normalizeDateColumn(existing.date as string | Date);
    if (!DateTime.fromISO(nextDate).isValid) {
      throw new BusinessRuleException(
        'INVALID_DATE',
        'Data inválida. Use yyyy-MM-dd.',
      );
    }
    const mergedStart =
      dto.startTime !== undefined ? dto.startTime : existing.startTime;
    const mergedEnd =
      dto.endTime !== undefined ? dto.endTime : existing.endTime;
    const norm = normalizeTimeOffTimes(mergedStart, mergedEnd);
    return this.availabilityRepository.updateTimeOff(timeOffId, tenantId, {
      date: nextDate,
      startTime: norm.startTime,
      endTime: norm.endTime,
      ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
    });
  }
}
