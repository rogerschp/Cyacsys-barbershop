import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import { RequestUser } from '../../auth/strategies/bearer-token.strategy';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { TenantUserEntity } from '../entities/tenant-user.entity';
import { TenantUserService } from '../tenant-user.service';

export type RequestWithTenant = Request & {
  user: RequestUser;
  tenant: TenantEntity;
  tenantMembership?: TenantUserEntity;
};

@Injectable()
export class TenantMembershipGuard implements CanActivate {
  private readonly logger = new Logger(TenantMembershipGuard.name);

  constructor(private readonly tenantUserService: TenantUserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const user = request.user?.dbUser;
    const tenant = request.tenant;
    const path = request.url ?? request.path ?? request.originalUrl ?? '';

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
        'Tenant not resolved. Use TenantInterceptor (e.g. param :tenantId, :slug or header x-tenant) first.',
        { path },
      );
    }

    try {
      const membership = await this.tenantUserService.validateMembership(
        user.id,
        tenant.id,
      );
      request.tenantMembership = membership;
      return true;
    } catch (err: unknown) {
      if (err instanceof ForbiddenException) {
        this.logger.warn({
          level: 'warn',
          event: 'membership_denied',
          userId: user.id,
          tenantId: tenant.id,
          path,
          method: request.method ?? '',
          timestamp: new Date().toISOString(),
        });
        throw new TenantForbiddenException(
          'NO_MEMBERSHIP',
          'User is not a member of this tenant or membership is inactive.',
          { tenantId: tenant.id, path },
        );
      }
      throw err;
    }
  }
}
