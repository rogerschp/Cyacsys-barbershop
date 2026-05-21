import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../interfaces/tenant-user-repository.interface';
import { TenantUserEntity } from '../entities/tenant-user.entity';

@Injectable()
export class FindMembershipByTenantIdAndUserIdUseCase {
  constructor(
    @Inject(TENANT_USER_REPOSITORY)
    private readonly repo: ITenantUserRepository,
  ) {}
  async run(userId: string, tenantId: string): Promise<TenantUserEntity> {
    const link = await this.repo.findByTenantAndUser(tenantId, userId);
    if (!link) {
      throw new NotFoundException(
        'No membership found for this user in this tenant.',
      );
    }
    return link;
  }
}
