import { Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { ServiceEntity } from '../entities/service.entity';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '../interfaces/service-repository.interface';
@Injectable()
export class GetServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
  ) {}
  async run(tenantId: string, serviceId: string): Promise<ServiceEntity> {
    const service = await this.serviceRepository.findById(serviceId, tenantId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }
}
