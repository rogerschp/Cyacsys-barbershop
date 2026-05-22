import { Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { hasEffectiveTenantRole } from '../../../common/utils/tenant-role.utils';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import {
  PROFESSIONAL_PROFILE_REPOSITORY,
  IProfessionalProfileRepository,
} from '../../professional-profile/interfaces/professional-profile-repository.interface';
import { LinkProfessionalToTenantDto } from '../dto/link-professional-to-tenant.dto';
import { TenantProfessionalEntity } from '../entities/tenant-professional.entity';
import { TenantProfessionalStatus } from '../entities/tenant-professional-status.enum';
import {
  TENANT_PROFESSIONAL_REPOSITORY,
  ITenantProfessionalRepository,
} from '../interfaces/tenant-professional-repository.interface';

@Injectable()
export class LinkProfessionalToTenantUseCase {
  private readonly logger = new Logger(LinkProfessionalToTenantUseCase.name);

  constructor(
    @Inject(TENANT_PROFESSIONAL_REPOSITORY)
    private readonly tenantProfessionalRepository: ITenantProfessionalRepository,
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(
    tenantId: string,
    dto: LinkProfessionalToTenantDto,
    performedBy: string,
  ): Promise<TenantProfessionalEntity> {
    await this.findTenantByIdUseCase.run(tenantId);

    const profile = await this.professionalProfileRepository.findById(
      dto.professionalProfileId,
    );
    if (!profile) {
      throw new BusinessRuleException(
        'PROFESSIONAL_PROFILE_NOT_FOUND',
        'Perfil profissional não encontrado.',
        { professionalProfileId: dto.professionalProfileId },
      );
    }
    if (!profile.isActive) {
      throw new BusinessRuleException(
        'PROFESSIONAL_INACTIVE',
        'Perfil profissional inativo não pode ser vinculado ao tenant.',
      );
    }

    if (
      !hasEffectiveTenantRole(dto.role, TenantUserRole.BARBER) &&
      dto.role !== TenantUserRole.OWNER
    ) {
      throw new BusinessRuleException(
        'INVALID_TENANT_PROFESSIONAL_ROLE',
        'O papel operacional deve ser BARBER (ou OWNER).',
        { role: dto.role },
      );
    }

    const existing =
      await this.tenantProfessionalRepository.findByTenantAndProfile(
        tenantId,
        dto.professionalProfileId,
      );

    if (existing) {
      if (existing.status === TenantProfessionalStatus.ACTIVE) {
        throw new BusinessRuleException(
          'TENANT_PROFESSIONAL_ALREADY_ACTIVE',
          'Este profissional já está ativo neste tenant.',
        );
      }
      if (existing.status === TenantProfessionalStatus.LEFT) {
        const rejoined = await this.tenantProfessionalRepository.update(
          existing.id,
          tenantId,
          {
            role: dto.role,
            status: TenantProfessionalStatus.ACTIVE,
            joinedAt: new Date(),
            leftAt: null,
          },
        );
        this.logger.log({
          event: 'tenant_professional_rejoined',
          tenantId,
          tenantProfessionalId: rejoined.id,
          professionalProfileId: dto.professionalProfileId,
          performedBy,
          timestamp: new Date().toISOString(),
        });
        return rejoined;
      }
      throw new BusinessRuleException(
        'TENANT_PROFESSIONAL_ALREADY_EXISTS',
        'Já existe vínculo com este profissional neste tenant.',
        { status: existing.status },
      );
    }

    const link = await this.tenantProfessionalRepository.create({
      tenantId,
      professionalProfileId: dto.professionalProfileId,
      role: dto.role,
    });

    this.logger.log({
      event: 'tenant_professional_linked',
      tenantId,
      tenantProfessionalId: link.id,
      professionalProfileId: dto.professionalProfileId,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return link;
  }
}
