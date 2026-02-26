import { SetMetadata } from '@nestjs/common';

export const TENANT_ROLES_KEY = 'tenant_roles';

/**
 * Define os papéis de tenant necessários para acessar o handler.
 * Deve ser usado junto com BearerAuthGuard → TenantInterceptor → TenantMembershipGuard → TenantRolesGuard.
 * Aceita strings (ex.: TenantUserRole.OWNER, TenantUserRole.ADMIN) para evitar acoplamento ao módulo tenant-user.
 */
export const TenantRoles = (...roles: string[]) =>
  SetMetadata(TENANT_ROLES_KEY, roles);
