import { Inject, Injectable } from '@nestjs/common';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
import { ensureWorkingHoursForTenantProfessional } from '../utils/ensure-working-hours-for-tenant-professional';
@Injectable()
export class DeleteWorkingHoursUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(tenantId: string, tenantProfessionalId: string, workingHoursId: string, userId: string, callerRole?: string): Promise<void> {
        await assertTenantProfessionalAgendaAccess({
            tenantId,
            tenantProfessionalId,
            userId,
            callerRole,
            tenantProfessionalRepository: this.tenantProfessionalRepository,
        });
        await ensureWorkingHoursForTenantProfessional(this.availabilityRepository, workingHoursId, tenantProfessionalId, tenantId, false);
        await this.availabilityRepository.softDeleteWorkingHours(workingHoursId, tenantId);
    }
}
