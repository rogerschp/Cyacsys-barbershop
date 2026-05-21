import { Inject, Injectable } from '@nestjs/common';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { CreateWorkingHoursPeriodDto } from '../dto/create-working-hours-period.dto';
import { WorkingHoursPeriodEntity } from '../entities/working-hours-period.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { ensureWorkingHoursForTenantProfessional } from '../utils/ensure-working-hours-for-tenant-professional';
import { validatePeriodsNoOverlap } from '../utils/validate-periods-no-overlap';
@Injectable()
export class CreateWorkingHoursPeriodUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(tenantId: string, tenantProfessionalId: string, workingHoursId: string, dto: CreateWorkingHoursPeriodDto, userId: string, callerRole?: string): Promise<WorkingHoursPeriodEntity> {
        await assertTenantProfessionalAgendaAccess({
            tenantId,
            tenantProfessionalId,
            userId,
            callerRole,
            tenantProfessionalRepository: this.tenantProfessionalRepository,
        });
        const wh = await ensureWorkingHoursForTenantProfessional(this.availabilityRepository, workingHoursId, tenantProfessionalId, tenantId, false);
        const existing = await this.availabilityRepository.listPeriodsByWorkingHoursId(workingHoursId, tenantId);
        validatePeriodsNoOverlap([
            ...existing.map((p) => ({
                startTime: p.startTime,
                endTime: p.endTime,
            })),
            { startTime: dto.startTime, endTime: dto.endTime },
        ]);
        return this.availabilityRepository.createWorkingHoursPeriod({
            workingHoursId: wh.id,
            startTime: dto.startTime,
            endTime: dto.endTime,
        });
    }
}
