import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantForbiddenException } from '../exceptions/tenant-forbidden.exception';
import { TENANT_ROLES_KEY } from '../decorators/tenant-roles.decorator';
export interface RequestWithTenantRole {
  user?: {
    dbUser?: {
      id: string;
    };
  };
  tenant?: {
    id: string;
  };
  tenantMembership?: {
    role: string;
  };
  url?: string;
  path?: string;
  originalUrl?: string;
  method?: string;
}
@Injectable()
export class TenantRolesGuard implements CanActivate {
  private readonly logger = new Logger(TenantRolesGuard.name);
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.getRequiredRoles(context);
    if (!requiredRoles?.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithTenantRole>();
    const user = request.user?.dbUser;
    const tenant = request.tenant;
    const membership = request.tenantMembership;
    const path = request.url ?? request.path ?? request.originalUrl ?? '';
    const method = request.method ?? '';
    if (!user?.id) {
      throw new TenantForbiddenException(
        'USER_NOT_IDENTIFIED',
        'User not identified. Use BearerAuthGuard first.',
        { tenantId: tenant?.id, path },
      );
    }
    if (!tenant?.id) {
      throw new TenantForbiddenException(
        'TENANT_NOT_RESOLVED',
        'Tenant not resolved. Use TenantInterceptor and TenantMembershipGuard first.',
        { path },
      );
    }
    if (!membership) {
      this.logStructuredWarn({
        event: 'authorization_denied',
        userId: user.id,
        tenantId: tenant.id,
        role: undefined,
        requiredRoles,
        path,
        method,
        reason: 'no_membership',
      });
      throw new TenantForbiddenException(
        'NO_MEMBERSHIP',
        'User is not a member of this tenant.',
        { tenantId: tenant.id, path },
      );
    }
    const hasRole = requiredRoles.includes(membership.role);
    if (!hasRole) {
      this.logStructuredWarn({
        event: 'authorization_denied',
        userId: user.id,
        tenantId: tenant.id,
        role: membership.role,
        requiredRoles,
        path,
        method,
      });
      throw new TenantForbiddenException(
        'INSUFFICIENT_ROLE',
        `Role ${membership.role} cannot access this resource. Required: ${requiredRoles.join(' or ')}.`,
        { tenantId: tenant.id, path },
      );
    }
    return true;
  }
  private getRequiredRoles(context: ExecutionContext): string[] | undefined {
    return this.reflector.getAllAndOverride<string[]>(TENANT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
  private logStructuredWarn(payload: {
    event: string;
    userId: string;
    tenantId: string;
    role?: string;
    requiredRoles: string[];
    path: string;
    method: string;
    reason?: string;
  }): void {
    this.logger.warn({
      level: 'warn',
      event: payload.event,
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      requiredRoles: payload.requiredRoles,
      path: payload.path,
      method: payload.method,
      ...(payload.reason && { reason: payload.reason }),
      timestamp: new Date().toISOString(),
    });
  }
}
