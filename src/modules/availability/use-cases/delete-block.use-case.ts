import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { ProfessionalAvailabilityBlockEntity } from '../entities/professional-availability-block.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
@Injectable()
export class DeleteBlockUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(tenantId: string, tenantProfessionalId: string, blockId: string, userId: string, callerRole?: string): Promise<ProfessionalAvailabilityBlockEntity> {
        await assertTenantProfessionalAgendaAccess({
            tenantId,
            tenantProfessionalId,
            userId,
            callerRole,
            tenantProfessionalRepository: this.tenantProfessionalRepository,
        });
        const existing = await this.availabilityRepository.findBlockById(blockId, tenantId);
        if (!existing || existing.tenantProfessionalId !== tenantProfessionalId) {
            throw new NotFoundException('Block not found');
        }
        return this.availabilityRepository.softDeleteBlock(blockId, tenantId);
    }
}
