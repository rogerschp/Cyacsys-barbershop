import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { FindTenantByIdUseCase } from './find-tenant-by-id.use-case';

@Injectable()
export class DeleteTenantByIdUseCase {
  constructor(
    private readonly repo: TenantRepository,
    private readonly findTenantById: FindTenantByIdUseCase,
  ) {}
  async run(id: string) {
    const tenant = await this.findTenantById.run(id);
    if (!tenant) throw new NotFoundException('Tenant Not Found!');
    return this.repo.softDelete(id);
  }
}
