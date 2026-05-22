import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { UpdateProfessionalServiceLinkDto } from '../dto/update-professional-service-link.dto';
import { ProfessionalServiceLinkEntity } from '../entities/professional-service-link.entity';
import { AVAILABILITY_REPOSITORY, IAvailabilityRepository, } from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
@Injectable()
export class UpdateProfessionalServiceLinkUseCase {
    constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository, 
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(tenantId: string, tenantProfessionalId: string, linkId: string, dto: UpdateProfessionalServiceLinkDto, userId: string, callerRole?: string): Promise<ProfessionalServiceLinkEntity> {
        await assertTenantProfessionalAgendaAccess({
            tenantId,
            tenantProfessionalId,
            userId,
            callerRole,
            tenantProfessionalRepository: this.tenantProfessionalRepository,
        });
        const link = await this.availabilityRepository.findProfessionalServiceLinkById(linkId, tenantId);
        if (!link || link.tenantProfessionalId !== tenantProfessionalId) {
            throw new NotFoundException('Professional service link not found');
        }
        if (dto.isActive === undefined) {
            return link;
        }
        return this.availabilityRepository.updateProfessionalServiceLink(linkId, tenantId, {
            isActive: dto.isActive,
        });
    }
}
