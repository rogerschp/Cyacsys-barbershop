import { Inject, Injectable } from '@nestjs/common';
import { ServiceEntity } from '../entities/service.entity';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '../interfaces/service-repository.interface';
@Injectable()
export class ListServicesByTenantUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
  ) {}
  async run(tenantId: string): Promise<ServiceEntity[]> {
    return this.serviceRepository.listByTenant(tenantId);
  }
}
