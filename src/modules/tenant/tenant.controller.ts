import { Controller, Get, Param } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }
}
