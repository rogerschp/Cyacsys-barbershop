import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../interfaces/tenant-user-repository.interface';
import { TenantUserEntity } from '../entities/tenant-user.entity';

@Injectable()
export class FindTenantUserByIdAndTenantUseCase {
  constructor(
    @Inject(TENANT_USER_REPOSITORY)
    private readonly repo: ITenantUserRepository,
  ) {}
  async run(userId: string, tenantId: string): Promise<TenantUserEntity> {
    const link = await this.repo.findByIdAndTenant(userId, tenantId);
    if (!link) {
      throw new NotFoundException('Tenant user not found');
    }
    return link;
  }
}
