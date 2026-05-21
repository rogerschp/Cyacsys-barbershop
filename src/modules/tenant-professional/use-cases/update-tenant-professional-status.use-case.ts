import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { UpdateTenantProfessionalStatusDto } from '../dto/update-tenant-professional-status.dto';
import { TenantProfessionalEntity } from '../entities/tenant-professional.entity';
import { TenantProfessionalStatus } from '../entities/tenant-professional-status.enum';
import {
  TENANT_PROFESSIONAL_REPOSITORY,
  ITenantProfessionalRepository,
} from '../interfaces/tenant-professional-repository.interface';

@Injectable()
export class UpdateTenantProfessionalStatusUseCase {
  private readonly logger = new Logger(UpdateTenantProfessionalStatusUseCase.name);

  constructor(
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    dto: UpdateTenantProfessionalStatusDto,
    performedBy: string,
  ): Promise<TenantProfessionalEntity> {
    const existing = await this.tenantProfessionalRepository.findById(
      tenantProfessionalId,
      tenantId,
    );
    if (!existing) {
      throw new NotFoundException('Tenant professional not found');
    }

    if (existing.status === dto.status) {
      return existing;
    }

    const updates: {
      status: TenantProfessionalStatus;
      leftAt?: Date | null;
      joinedAt?: Date;
    } = { status: dto.status };

    if (dto.status === TenantProfessionalStatus.LEFT) {
      updates.leftAt = new Date();
    } else if (existing.status === TenantProfessionalStatus.LEFT) {
      updates.leftAt = null;
      updates.joinedAt = new Date();
    }

    if (
      dto.status === TenantProfessionalStatus.ACTIVE &&
      existing.professionalProfile &&
      !existing.professionalProfile.isActive
    ) {
      throw new BusinessRuleException(
        'PROFESSIONAL_INACTIVE',
        'Não é possível ativar vínculo com perfil profissional global inativo.',
      );
    }

    const updated = await this.tenantProfessionalRepository.update(
      tenantProfessionalId,
      tenantId,
      updates,
    );

    this.logger.log({
      event: 'tenant_professional_status_updated',
      tenantId,
      tenantProfessionalId,
      status: dto.status,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}
