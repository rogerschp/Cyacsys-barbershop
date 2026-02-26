import { SetMetadata } from '@nestjs/common';
import { TenantUserRole } from '../entities/tenant-user-role.enum';

export const TENANT_ROLES_KEY = 'tenant_roles';

/**
 * Define os papéis de tenant necessários para acessar o handler.
 * Deve ser usado junto com BearerAuthGuard → TenantInterceptor → TenantMembershipGuard → TenantRolesGuard.
 */
export const TenantRoles = (...roles: TenantUserRole[]) =>
  SetMetadata(TENANT_ROLES_KEY, roles);
