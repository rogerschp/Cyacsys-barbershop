import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantProfessionalEntity } from '../entities/tenant-professional.entity';
import { TenantProfessionalStatus } from '../entities/tenant-professional-status.enum';
import {
  TENANT_PROFESSIONAL_REPOSITORY,
  ITenantProfessionalRepository,
} from '../interfaces/tenant-professional-repository.interface';

@Injectable()
export class LeaveTenantProfessionalUseCase {
  private readonly logger = new Logger(LeaveTenantProfessionalUseCase.name);

  constructor(
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
  ) {}

  async run(
    tenantId: string,
    tenantProfessionalId: string,
    performedBy: string,
    callerRole?: string,
  ): Promise<TenantProfessionalEntity> {
    const existing = await this.tenantProfessionalRepository.findById(
      tenantProfessionalId,
      tenantId,
    );
    if (!existing) {
      throw new NotFoundException('Tenant professional not found');
    }

    if (existing.status === TenantProfessionalStatus.LEFT) {
      throw new BusinessRuleException(
        'TENANT_PROFESSIONAL_ALREADY_LEFT',
        'O profissional já saiu deste tenant.',
      );
    }

    const isAdmin =
      callerRole === TenantUserRole.OWNER ||
      callerRole === TenantUserRole.ADMIN;
    const isSelf = existing.professionalProfile?.userId === performedBy;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException(
        'Sem permissão para encerrar este vínculo profissional.',
      );
    }

    const leftAt = new Date();
    const updated = await this.tenantProfessionalRepository.update(
      tenantProfessionalId,
      tenantId,
      {
        status: TenantProfessionalStatus.LEFT,
        leftAt,
      },
    );

    this.logger.log({
      event: 'tenant_professional_left',
      tenantId,
      tenantProfessionalId,
      performedBy,
      timestamp: leftAt.toISOString(),
    });

    return updated;
  }
}
