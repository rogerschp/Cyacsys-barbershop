import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { TenantStatus } from '../../modules/tenant/entities/tenant-status.enum';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { FindTenantBySlugUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-slug.use-case';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantResolverGuard implements CanActivate {
  constructor(
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
    private readonly findTenantBySlugUseCase: FindTenantBySlugUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    const tenantId = req.params?.tenantId || req.params?.id;
    const slug =
      req.params?.slug ||
      req.headers?.['x-tenant'] ||
      req.headers?.['X-Tenant'];

    const identifier = tenantId ?? slug;

    if (!identifier) {
      throw new BadRequestException(
        'Tenant not informed (use :tenantId, :slug, or header x-tenant)',
      );
    }

    const isUuid = UUID_REGEX.test(String(identifier).trim());

    const tenant = isUuid
      ? await this.findTenantByIdUseCase.run(String(identifier).trim())
      : await this.findTenantBySlugUseCase.run(
          String(identifier).toLowerCase().trim(),
        );

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new ForbiddenException('Tenant is not active');
    }

    req.tenant = tenant;
    return true;
  }
}
