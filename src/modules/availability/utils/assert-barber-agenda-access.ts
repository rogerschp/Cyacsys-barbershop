/**
 * @deprecated Usado pelo módulo Booking até a Fase 4 (tenantProfessionalId).
 * Availability usa assert-tenant-professional-agenda-access.
 */
import { NotFoundException } from '@nestjs/common';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { FindTenantUserByIdAndTenantUseCase } from '../../tenant-user/use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { IBarberProfileRepository } from '../../barber-profile/interfaces/barber-profile-repository.interface';

const MANAGER_ROLES = new Set<string>([
  TenantUserRole.OWNER,
  TenantUserRole.ADMIN,
  TenantUserRole.STAFF,
]);

export async function assertBarberAgendaAccess(params: {
  tenantId: string;
  barberProfileId: string;
  userId: string;
  callerRole?: string;
  barberProfileRepository: IBarberProfileRepository;
  findTenantUserByIdAndTenant: FindTenantUserByIdAndTenantUseCase;
}): Promise<void> {
  const {
    tenantId,
    barberProfileId,
    userId,
    callerRole,
    barberProfileRepository,
    findTenantUserByIdAndTenant,
  } = params;

  if (!callerRole || MANAGER_ROLES.has(callerRole)) {
    return;
  }

  if (callerRole !== TenantUserRole.BARBER) {
    throw new TenantForbiddenException(
      'FORBIDDEN',
      'Sem permissão para gerenciar a agenda deste barbeiro.',
      { tenantId },
    );
  }

  const profile = await barberProfileRepository.findById(
    barberProfileId,
    tenantId,
  );
  if (!profile) {
    throw new NotFoundException('Barber profile not found');
  }

  const tenantUser = await findTenantUserByIdAndTenant.run(
    profile.tenantUserId,
    tenantId,
  );
  if (tenantUser.userId !== userId) {
    throw new TenantForbiddenException(
      'FORBIDDEN',
      'Barbeiro só pode gerenciar a própria agenda.',
      { tenantId },
    );
  }
}
