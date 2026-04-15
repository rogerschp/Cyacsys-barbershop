import { TenantUserRole } from '../../modules/tenant-user/entities/tenant-user-role.enum';

const ROLE_IMPLICATIONS: Record<TenantUserRole, TenantUserRole[]> = {
  [TenantUserRole.OWNER]: [
    TenantUserRole.OWNER,
    TenantUserRole.ADMIN,
    TenantUserRole.STAFF,
    TenantUserRole.BARBER,
  ],
  [TenantUserRole.ADMIN]: [TenantUserRole.ADMIN, TenantUserRole.STAFF],
  [TenantUserRole.STAFF]: [TenantUserRole.STAFF],
  [TenantUserRole.BARBER]: [TenantUserRole.BARBER],
};

export function resolveEffectiveTenantRoles(role?: string): Set<string> {
  if (!role) {
    return new Set<string>();
  }

  const normalizedRole = role as TenantUserRole;
  const impliedRoles = ROLE_IMPLICATIONS[normalizedRole];

  if (!impliedRoles) {
    return new Set<string>([role]);
  }

  return new Set<string>(impliedRoles);
}

export function hasEffectiveTenantRole(
  currentRole: string | undefined,
  requiredRole: string,
): boolean {
  return resolveEffectiveTenantRoles(currentRole).has(requiredRole);
}

export function hasAnyEffectiveTenantRole(
  currentRole: string | undefined,
  requiredRoles: string[],
): boolean {
  const effectiveRoles = resolveEffectiveTenantRoles(currentRole);
  return requiredRoles.some((role) => effectiveRoles.has(role));
}
