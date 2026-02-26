import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
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
  constructor(private readonly tenantUserService: TenantUserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const user = request.user?.dbUser;
    const tenant = request.tenant;

    if (!user?.id) {
      throw new ForbiddenException(
        'User not identified. Use BearerAuthGuard first.',
      );
    }
    if (!tenant?.id) {
      throw new ForbiddenException(
        'Tenant not resolved. Use TenantInterceptor (e.g. param :slug or header x-tenant) first.',
      );
    }

    const membership = await this.tenantUserService.validateMembership(
      user.id,
      tenant.id,
    );
    request.tenantMembership = membership;
    return true;
  }
}
