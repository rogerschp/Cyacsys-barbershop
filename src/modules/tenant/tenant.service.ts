import { Injectable } from '@nestjs/common';
import { TenantRepository } from '../../repository/tenant/tenant.repository';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepo: TenantRepository) {}

  async findBySlug(slug: string) {
    return this.tenantRepo.findBySlug(slug);
  }
}
