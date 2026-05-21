import { Inject, Injectable } from '@nestjs/common';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { TenantProfessionalEntity } from '../entities/tenant-professional.entity';
import {
  TENANT_PROFESSIONAL_REPOSITORY,
  ITenantProfessionalRepository,
} from '../interfaces/tenant-professional-repository.interface';

@Injectable()
export class ListTenantProfessionalsUseCase {
  constructor(
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(
    tenantId: string,
    options?: { activeOnly?: boolean },
  ): Promise<TenantProfessionalEntity[]> {
    await this.findTenantByIdUseCase.run(tenantId);
    return this.tenantProfessionalRepository.listByTenant(tenantId, options);
  }
}
