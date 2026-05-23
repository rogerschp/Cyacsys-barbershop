import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { UpdateWorkingHoursPeriodDto } from '../dto/update-working-hours-period.dto';
import { WorkingHoursPeriodEntity } from '../entities/working-hours-period.entity';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { ensureWorkingHoursForTenantProfessional } from '../utils/ensure-working-hours-for-tenant-professional';
import { validatePeriodsNoOverlap } from '../utils/validate-periods-no-overlap';
@Injectable()
export class UpdateWorkingHoursPeriodUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    workingHoursId: string,
    periodId: string,
    dto: UpdateWorkingHoursPeriodDto,
    userId: string,
    callerRole?: string,
  ): Promise<WorkingHoursPeriodEntity> {
    await assertTenantProfessionalAgendaAccess({
      tenantId,
      tenantProfessionalId,
      userId,
      callerRole,
      tenantProfessionalRepository: this.tenantProfessionalRepository,
    });
    await ensureWorkingHoursForTenantProfessional(
      this.availabilityRepository,
      workingHoursId,
      tenantProfessionalId,
      tenantId,
      false,
    );
    const period = await this.availabilityRepository.findWorkingHoursPeriodById(
      periodId,
      tenantId,
    );
    if (!period || period.workingHoursId !== workingHoursId) {
      throw new NotFoundException('Working hours period not found');
    }
    const nextStart = dto.startTime ?? period.startTime;
    const nextEnd = dto.endTime ?? period.endTime;
    const others =
      await this.availabilityRepository.listPeriodsByWorkingHoursId(
        workingHoursId,
        tenantId,
      );
    const peer = others
      .filter((p) => p.id !== periodId)
      .map((p) => ({ startTime: p.startTime, endTime: p.endTime }));
    validatePeriodsNoOverlap([
      ...peer,
      { startTime: nextStart, endTime: nextEnd },
    ]);
    if (dto.startTime === undefined && dto.endTime === undefined) {
      return period;
    }
    return this.availabilityRepository.updateWorkingHoursPeriod(
      periodId,
      tenantId,
      {
        ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
        ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
      },
    );
  }
}
