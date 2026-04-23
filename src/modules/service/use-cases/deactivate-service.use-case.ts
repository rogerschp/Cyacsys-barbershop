import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { ServiceEntity } from '../entities/service.entity';
import { IServiceRepository, SERVICE_REPOSITORY, } from '../interfaces/service-repository.interface';
@Injectable()
export class DeactivateServiceUseCase {
    private readonly logger = new Logger(DeactivateServiceUseCase.name);
    constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository) { }
    async run(tenantId: string, serviceId: string, performedBy: string): Promise<ServiceEntity> {
        const existing = await this.serviceRepository.findById(serviceId, tenantId);
        if (!existing) {
            throw new NotFoundException('Service not found');
        }
        const updated = await this.serviceRepository.update(serviceId, tenantId, {
            isActive: false,
        });
        this.logger.log({
            event: 'service_deactivated',
            tenantId,
            serviceId,
            performedBy,
            timestamp: new Date().toISOString(),
        });
        return updated;
    }
}
