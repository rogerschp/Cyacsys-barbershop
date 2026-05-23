import { NotFoundException } from '@nestjs/common';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { ITenantProfessionalRepository } from '../../tenant-professional/interfaces/tenant-professional-repository.interface';

const MANAGER_ROLES = new Set<string>([
  TenantUserRole.OWNER,
  TenantUserRole.ADMIN,
  TenantUserRole.STAFF,
]);

export async function assertTenantProfessionalAgendaAccess(params: {
  tenantId: string;
  tenantProfessionalId: string;
  userId: string;
  callerRole?: string;
  tenantProfessionalRepository: ITenantProfessionalRepository;
}): Promise<void> {
  const {
    tenantId,
    tenantProfessionalId,
    userId,
    callerRole,
    tenantProfessionalRepository,
  } = params;

  const link = await tenantProfessionalRepository.findById(
    tenantProfessionalId,
    tenantId,
  );
  if (!link) {
    throw new NotFoundException(
      'Tenant professional not found in this tenant. Use the id from tenant_professionals (POST /tenant-professionals/me or /tenant-professionals), not professional_profiles.id.',
    );
  }

  if (!callerRole) {
    throw new TenantForbiddenException(
      'FORBIDDEN',
      'Sem papel de membership válido para gerenciar agenda.',
      { tenantId },
    );
  }

  if (MANAGER_ROLES.has(callerRole)) {
    return;
  }

  if (callerRole !== TenantUserRole.BARBER) {
    throw new TenantForbiddenException(
      'FORBIDDEN',
      'Sem permissão para gerenciar a agenda deste profissional.',
      { tenantId },
    );
  }

  if (link.professionalProfile?.userId !== userId) {
    throw new TenantForbiddenException(
      'FORBIDDEN',
      'Profissional só pode gerenciar a própria agenda neste tenant.',
      { tenantId },
    );
  }
}
