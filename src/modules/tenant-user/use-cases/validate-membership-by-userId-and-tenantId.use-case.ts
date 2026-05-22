import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from '../interfaces/tenant-user-repository.interface';
import { TenantUserEntity } from '../entities/tenant-user.entity';
import { TenantUserStatus } from '../entities/tenant-user-status.enum';

@Injectable()
export class ValidateMembershipByUserIdAndTenantIdUseCase {
  constructor(
    @Inject(TENANT_USER_REPOSITORY)
    private readonly repo: ITenantUserRepository,
  ) {}
  async run(userId: string, tenantId: string): Promise<TenantUserEntity> {
    const link = await this.repo.findByTenantAndUser(tenantId, userId);
    if (!link) {
      throw new NotFoundException('User is not a member of this tenant.');
    }
    if (link.status !== TenantUserStatus.ACTIVE) {
      throw new ForbiddenException(
        'Membership is inactive. Access to this tenant is denied.',
      );
    }
    return link;
  }
}
