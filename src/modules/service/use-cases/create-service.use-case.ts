import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantService } from '../../tenant/tenant.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { ServiceEntity } from '../entities/service.entity';
import { IServiceRepository, SERVICE_REPOSITORY, } from '../interfaces/service-repository.interface';
const MIN_DURATION = 5;
const MIN_PRICE = 0;
@Injectable()
export class CreateServiceUseCase {
    private readonly logger = new Logger(CreateServiceUseCase.name);
    constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository, private readonly tenantService: TenantService) { }
    async run(tenantId: string, dto: CreateServiceDto, createdBy: string): Promise<ServiceEntity> {
        const tenant = await this.tenantService.findById(tenantId);
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        if (dto.price < MIN_PRICE) {
            throw new BusinessRuleException('SERVICE_INVALID_PRICE', 'Preço não pode ser negativo.');
        }
        if (dto.durationInMinutes < MIN_DURATION) {
            throw new BusinessRuleException('SERVICE_INVALID_DURATION', `Duração mínima é ${MIN_DURATION} minutos.`);
        }
        const normalizedName = dto.name.trim();
        const existing = await this.serviceRepository.findNonDeletedByName(tenantId, normalizedName);
        if (existing) {
            throw new BusinessRuleException('SERVICE_NAME_ALREADY_EXISTS', `Service name '${normalizedName}' already exists in this tenant`, { tenantId });
        }
        const priceStr = Number(dto.price).toFixed(2);
        const service = await this.serviceRepository.create({
            tenantId,
            name: normalizedName,
            description: dto.description ?? null,
            price: priceStr,
            durationInMinutes: dto.durationInMinutes,
        });
        this.logger.log({
            event: 'service_created',
            tenantId,
            serviceId: service.id,
            createdBy,
            price: parseFloat(priceStr),
            timestamp: new Date().toISOString(),
        });
        return service;
    }
}
