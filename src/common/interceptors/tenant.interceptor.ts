import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TenantService } from 'src/modules/tenant/tenant.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly tenantService: TenantService) {}

  async intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();

    const slug = req.params.slug || req.headers['x-tenant'];

    if (!slug) {
      throw new BadRequestException('Tenant not informed');
    }

    const tenant = await this.tenantService.findBySlug(slug);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    req.tenant = tenant;

    return next.handle();
  }
}
