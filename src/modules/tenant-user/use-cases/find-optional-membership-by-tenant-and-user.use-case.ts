import { Inject, Injectable } from '@nestjs/common';
import { TenantUserEntity } from '../entities/tenant-user.entity';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../interfaces/tenant-user-repository.interface';

@Injectable()
export class FindOptionalMembershipByTenantAndUserUseCase {
  constructor(
    @Inject(TENANT_USER_REPOSITORY)
    private readonly repo: ITenantUserRepository,
  ) {}

  async run(
    tenantId: string,
    userId: string,
  ): Promise<TenantUserEntity | null> {
    return this.repo.findByTenantAndUser(tenantId, userId);
  }
}
