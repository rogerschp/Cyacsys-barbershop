import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { FindUserByIdUseCase } from 'src/modules/user/use-cases/find-user-by-id.use-case';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../interfaces/tenant-user-repository.interface';
import { TenantUserRole } from '../entities/tenant-user-role.enum';
import { TenantUserEntity } from '../entities/tenant-user.entity';

@Injectable()
export class AddUserToTenantUseCase {
  constructor(
    @Inject(TENANT_USER_REPOSITORY)
    private readonly repo: ITenantUserRepository,
    private readonly findTenantById: FindTenantByIdUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
  ) {}
  async run(
    userId: string,
    tenantId: string,
    role: TenantUserRole,
  ): Promise<TenantUserEntity> {
    await this.findTenantById.run(tenantId);
    await this.findUserByIdUseCase.run(userId);
    const existing = await this.repo.findByTenantAndUser(tenantId, userId);
    if (existing) {
      throw new ConflictException('User is already linked to this tenant');
    }
    return this.repo.create({ tenantId, userId, role });
  }
}
