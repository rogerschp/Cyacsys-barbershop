import { Inject, Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import {
  IServiceRepository,
  SERVICE_REPOSITORY,
} from '../../service/interfaces/service-repository.interface';
import { TENANT_PROFESSIONAL_REPOSITORY } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import type { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { CreateProfessionalServiceLinkDto } from '../dto/create-professional-service-link.dto';
import { ProfessionalServiceLinkEntity } from '../entities/professional-service-link.entity';
import {
  AVAILABILITY_REPOSITORY,
  IAvailabilityRepository,
} from '../interfaces/availability-repository.interface';
import { assertTenantProfessionalAgendaAccess } from '../utils/assert-tenant-professional-agenda-access';
@Injectable()
export class CreateProfessionalServiceLinkUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    dto: CreateProfessionalServiceLinkDto,
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
    const service = await this.serviceRepository.findById(
      dto.serviceId,
      tenantId,
    );
    if (!service) {
      throw new BusinessRuleException(
        'SERVICE_NOT_FOUND',
        'Serviço não encontrado neste tenant.',
      );
    }
    if (!service.isActive) {
      throw new BusinessRuleException(
        'SERVICE_INACTIVE',
        'Só é possível vincular serviços ativos do tenant.',
      );
    }
    const existing =
      await this.availabilityRepository.findProfessionalServiceLinkByProfessionalAndService(
        tenantProfessionalId,
        tenantId,
        dto.serviceId,
      );
    if (existing) {
      throw new BusinessRuleException(
        'PROFESSIONAL_SERVICE_ALREADY_EXISTS',
        'Este serviço já está vinculado ao profissional.',
      );
    }
    return this.availabilityRepository.createProfessionalServiceLink({
      tenantId,
      tenantProfessionalId,
      serviceId: dto.serviceId,
    });
  }
}
