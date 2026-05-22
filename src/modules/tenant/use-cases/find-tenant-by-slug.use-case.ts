import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';

@Injectable()
export class FindTenantBySlugUseCase {
  constructor(private readonly repo: TenantRepository) {}

  async run(slug: string) {
    const findSlug = await this.repo.findBySlug(slug);
    if (!findSlug) throw new NotFoundException('Tenant not found!');
    return findSlug;
  }
}
