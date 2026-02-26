import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { TenantForbiddenException } from '../exceptions/tenant-forbidden.exception';
import {
  ITenantMembershipResolver,
  TENANT_MEMBERSHIP_RESOLVER,
} from '../interfaces/tenant-membership-resolver.interface';

/**
 * Contrato mínimo do request para o guard.
 * user e tenant são preenchidos por BearerAuthGuard e TenantInterceptor.
 */
export interface RequestWithTenantMembershipContext {
  user?: { dbUser?: { id: string } };
  tenant?: { id: string };
  tenantMembership?: { role: string };
  url?: string;
  path?: string;
  originalUrl?: string;
  method?: string;
}

@Injectable()
export class TenantMembershipGuard implements CanActivate {
  private readonly logger = new Logger(TenantMembershipGuard.name);

  constructor(
    @Inject(TENANT_MEMBERSHIP_RESOLVER)
    private readonly resolver: ITenantMembershipResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantMembershipContext>();
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
      const membership = await this.resolver.validateMembership(
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
