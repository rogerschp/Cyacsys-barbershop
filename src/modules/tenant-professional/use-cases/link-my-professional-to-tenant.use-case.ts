import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { hasEffectiveTenantRole } from '../../../common/utils/tenant-role.utils';
import { FindMembershipByTenantIdAndUserIdUseCase } from '../../tenant-user/use-cases/find-membership-by-tenantId-and-userId.use-case';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import {
  PROFESSIONAL_PROFILE_REPOSITORY,
  IProfessionalProfileRepository,
} from '../../professional-profile/interfaces/professional-profile-repository.interface';
import { LinkProfessionalToTenantDto } from '../dto/link-professional-to-tenant.dto';
import { TenantProfessionalEntity } from '../entities/tenant-professional.entity';
import { LinkProfessionalToTenantUseCase } from './link-professional-to-tenant.use-case';

@Injectable()
export class LinkMyProfessionalToTenantUseCase {
  constructor(
    @Inject(PROFESSIONAL_PROFILE_REPOSITORY)
    private readonly professionalProfileRepository: IProfessionalProfileRepository,
    private readonly findMembershipByTenantIdAndUserIdUseCase: FindMembershipByTenantIdAndUserIdUseCase,
    private readonly linkProfessionalToTenantUseCase: LinkProfessionalToTenantUseCase,
  ) {}

  async run(
    tenantId: string,
    userId: string,
    role?: TenantUserRole,
  ): Promise<TenantProfessionalEntity> {
    const membership =
      await this.findMembershipByTenantIdAndUserIdUseCase.run(userId, tenantId);

    if (
      !hasEffectiveTenantRole(membership.role, TenantUserRole.BARBER) &&
      membership.role !== TenantUserRole.OWNER
    ) {
      throw new BusinessRuleException(
        'INVALID_TENANT_MEMBERSHIP_ROLE',
        'É necessário ser membro BARBER ou OWNER do tenant para atuar como profissional.',
      );
    }

    const profile =
      await this.professionalProfileRepository.findByUserIdNonDeleted(userId);
    if (!profile) {
      throw new NotFoundException(
        'Professional profile not found. Create your global profile first.',
      );
    }

    const operationalRole =
      role ??
      (membership.role === TenantUserRole.OWNER
        ? TenantUserRole.OWNER
        : TenantUserRole.BARBER);

    const dto: LinkProfessionalToTenantDto = {
      professionalProfileId: profile.id,
      role: operationalRole,
    };

    return this.linkProfessionalToTenantUseCase.run(tenantId, dto, userId);
  }
}
