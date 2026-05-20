import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantProfessionalEntity } from '../entities/tenant-professional.entity';
import {
  TENANT_PROFESSIONAL_REPOSITORY,
  ITenantProfessionalRepository,
} from '../interfaces/tenant-professional-repository.interface';

@Injectable()
export class GetTenantProfessionalUseCase {
  constructor(
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
  ): Promise<TenantProfessionalEntity> {
    const entity = await this.tenantProfessionalRepository.findById(
      tenantProfessionalId,
      tenantId,
    );
    if (!entity) {
      throw new NotFoundException('Tenant professional not found');
    }
    return entity;
  }
}
