import {
  ForbiddenException,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TenantService } from 'src/modules/tenant/tenant.service';
import { TenantStatus } from 'src/modules/tenant/entities/tenant-status.enum';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantService: TenantService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<any>();

    const slug =
      req.params?.slug ||
      req.headers?.['x-tenant'] ||
      req.headers?.['X-Tenant'];

    if (!slug) {
      throw new BadRequestException('Tenant not informed');
    }

    const normalizedSlug = String(slug).toLowerCase().trim();

    const tenant = await this.tenantService.findBySlug(normalizedSlug);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new ForbiddenException('Tenant is not active');
    }

    req.tenant = tenant;

    return next.handle();
  }
}
