import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../interfaces/tenant-user-repository.interface';

@Injectable()
export class RemoveUserFromTenantByUserIdAndTenantIdUseCase {
  constructor(
    @Inject(TENANT_USER_REPOSITORY)
    private readonly repo: ITenantUserRepository,
  ) {}
  async run(userId: string, tenantId: string): Promise<void> {
    const link = await this.repo.findByTenantAndUser(userId, tenantId);
    if (!link) {
      throw new NotFoundException(
        'No membership found for this user in this tenant.',
      );
    }
    await this.repo.deleteByTenantAndUser(userId, tenantId);
  }
}
