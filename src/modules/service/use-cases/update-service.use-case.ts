import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServiceEntity } from '../entities/service.entity';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '../interfaces/service-repository.interface';
const MIN_DURATION = 5;
const MIN_PRICE = 0;
@Injectable()
export class UpdateServiceUseCase {
  private readonly logger = new Logger(UpdateServiceUseCase.name);
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
  ) {}
  async run(
    tenantId: string,
    serviceId: string,
    dto: UpdateServiceDto,
    performedBy?: string,
  ): Promise<ServiceEntity> {
    const existing = await this.serviceRepository.findById(serviceId, tenantId);
    if (!existing) {
      throw new NotFoundException('Service not found');
    }
    const updates: {
      name?: string;
      description?: string | null;
      price?: string;
      durationInMinutes?: number;
      isActive?: boolean;
    } = {};
    if (dto.name !== undefined) {
      const normalizedName = dto.name.trim();
      const duplicate = await this.serviceRepository.findNonDeletedByName(
        tenantId,
        normalizedName,
        serviceId,
      );
      if (duplicate) {
        throw new BusinessRuleException(
          'SERVICE_NAME_ALREADY_EXISTS',
          `Service name '${normalizedName}' already exists in this tenant`,
          { tenantId },
        );
      }
      updates.name = normalizedName;
    }
    if (dto.description !== undefined) {
      updates.description = dto.description ?? null;
    }
    if (dto.price !== undefined) {
      if (dto.price < MIN_PRICE) {
        throw new BusinessRuleException(
          'SERVICE_INVALID_PRICE',
          'Preço não pode ser negativo.',
        );
      }
      updates.price = Number(dto.price).toFixed(2);
    }
    if (dto.durationInMinutes !== undefined) {
      if (dto.durationInMinutes < MIN_DURATION) {
        throw new BusinessRuleException(
          'SERVICE_INVALID_DURATION',
          `Duração mínima é ${MIN_DURATION} minutos.`,
        );
      }
      updates.durationInMinutes = dto.durationInMinutes;
    }
    if (dto.isActive !== undefined) {
      updates.isActive = dto.isActive;
    }
    if (Object.keys(updates).length === 0) {
      return existing;
    }
    const updated = await this.serviceRepository.update(
      serviceId,
      tenantId,
      updates,
    );
    this.logger.log({
      event: 'service_updated',
      tenantId,
      serviceId,
      updatedFields: Object.keys(updates),
      performedBy: performedBy ?? undefined,
      timestamp: new Date().toISOString(),
    });
    return updated;
  }
}
