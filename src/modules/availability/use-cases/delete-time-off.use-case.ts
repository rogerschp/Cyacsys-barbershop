import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { TimeOffEntity } from '../entities/time-off.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
@Injectable()
export class DeleteTimeOffUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(tenantId: string, tenantProfessionalId: string, timeOffId: string, userId: string, callerRole?: string): Promise<TimeOffEntity> {
        await assertTenantProfessionalAgendaAccess({
            tenantId,
            tenantProfessionalId,
            userId,
            callerRole,
            tenantProfessionalRepository: this.tenantProfessionalRepository,
        });
        const existing = await this.availabilityRepository.findTimeOffById(timeOffId, tenantId);
        if (!existing || existing.tenantProfessionalId !== tenantProfessionalId) {
            throw new NotFoundException('Time off not found');
        }
        return this.availabilityRepository.softDeleteTimeOff(timeOffId, tenantId);
    }
}
