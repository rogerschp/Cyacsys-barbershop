import { Inject, Injectable } from '@nestjs/common';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../interfaces/tenant-user-repository.interface';
import { TenantUserRole } from '../entities/tenant-user-role.enum';

@Injectable()
export class FindUserRoleByUserIdAndTenantIdUseCase {
  constructor(
    @Inject(TENANT_USER_REPOSITORY)
    private readonly repo: ITenantUserRepository,
  ) {}
  async run(userId: string, tenantId: string): Promise<TenantUserRole> {
    const link = await this.repo.findByIdAndTenant(userId, tenantId);
    return link?.role ?? null;
  }
}
