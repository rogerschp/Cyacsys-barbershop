import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import { TenantUserRole } from '../entities/tenant-user-role.enum';
import { TENANT_ROLES_KEY } from '../decorators/tenant-roles.decorator';
import { RequestWithTenant } from './tenant-membership.guard';

@Injectable()
export class TenantRolesGuard implements CanActivate {
  private readonly logger = new Logger(TenantRolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.getRequiredRoles(context);
    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithTenant>();
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
        requiredRoles: requiredRoles as string[],
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
        requiredRoles: requiredRoles as string[],
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

  private getRequiredRoles(
    context: ExecutionContext,
  ): TenantUserRole[] | undefined {
    return this.reflector.getAllAndOverride<TenantUserRole[]>(
      TENANT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
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
