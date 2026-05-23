import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { ProfessionalServiceLinkEntity } from '../entities/professional-service-link.entity';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
@Injectable()
export class DeleteProfessionalServiceLinkUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    linkId: string,
    userId: string,
    callerRole?: string,
  ): Promise<ProfessionalServiceLinkEntity> {
    await assertTenantProfessionalAgendaAccess({
      tenantId,
      tenantProfessionalId,
      userId,
      callerRole,
      tenantProfessionalRepository: this.tenantProfessionalRepository,
    });
    const link =
      await this.availabilityRepository.findProfessionalServiceLinkById(
        linkId,
        tenantId,
      );
    if (!link || link.tenantProfessionalId !== tenantProfessionalId) {
      throw new NotFoundException('Professional service link not found');
    }
    return this.availabilityRepository.softDeleteProfessionalServiceLink(
      linkId,
      tenantId,
    );
  }
}
