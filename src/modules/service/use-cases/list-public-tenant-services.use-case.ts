import { Inject, Injectable } from '@nestjs/common';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { TenantStatus } from '../../tenant/entities/tenant-status.enum';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import { ServiceEntity } from '../entities/service.entity';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '../interfaces/service-repository.interface';

@Injectable()
export class ListPublicTenantServicesUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(tenantId: string): Promise<ServiceEntity[]> {
    const tenant = await this.findTenantByIdUseCase.run(tenantId);
    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new TenantForbiddenException(
        'TENANT_NOT_ACTIVE',
        'Estabelecimento não está ativo.',
        { tenantId },
      );
    }

    const services = await this.serviceRepository.listByTenant(tenantId);
    return services.filter((service) => service.isActive);
  }
}
