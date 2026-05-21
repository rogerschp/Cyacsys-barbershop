import { NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { TenantProfessionalStatus } from '../../tenant-professional/entities/tenant-professional-status.enum';
import { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';
import { TenantProfessionalEntity } from '../../tenant-professional/entities/tenant-professional.entity';

export async function assertActiveTenantProfessional(
  tenantProfessionalRepository: ITenantProfessionalRepository,
  tenantProfessionalId: string,
  tenantId: string,
): Promise<TenantProfessionalEntity> {
  const link = await tenantProfessionalRepository.findById(
    tenantProfessionalId,
    tenantId,
  );
  if (!link) {
    throw new NotFoundException('Tenant professional not found');
  }
  if (link.status !== TenantProfessionalStatus.ACTIVE) {
    throw new BusinessRuleException(
      'TENANT_PROFESSIONAL_INACTIVE',
      'Profissional inativo neste tenant não possui agenda disponível.',
    );
  }
  if (!link.professionalProfile?.isActive) {
    throw new BusinessRuleException(
      'PROFESSIONAL_INACTIVE',
      'Perfil profissional global inativo.',
    );
  }
  return link;
}
