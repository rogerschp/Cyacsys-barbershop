import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';
import { UserService } from '../user/user.service';
import { TenantUserEntity } from './entities/tenant-user.entity';
import { TenantUserRole } from './entities/tenant-user-role.enum';
import { TenantUserStatus } from './entities/tenant-user-status.enum';
import {
  ITenantUserRepository,
  TENANT_USER_REPOSITORY,
} from './interfaces/tenant-user-repository.interface';

/**
 * Serviço do vínculo tenant–usuário. Base da autorização por tenant
 * (quem pode fazer o quê em qual tenant).
 */
@Injectable()
export class TenantUserService {
  constructor(
    @Inject(TENANT_USER_REPOSITORY)
    private readonly repo: ITenantUserRepository,
    private readonly tenantService: TenantService,
    private readonly userService: UserService,
  ) {}

  /**
   * Vincula um usuário a um tenant com o papel indicado.
   * Garante que tenant e usuário existem; evita duplicidade (unique na tabela).
   */
  async addUserToTenant(
    userId: string,
    tenantId: string,
    role: TenantUserRole,
  ): Promise<TenantUserEntity> {
    await this.tenantService.findById(tenantId);
    await this.userService.findById(userId);

    const existing = await this.repo.findByTenantAndUser(tenantId, userId);
    if (existing) {
      throw new ConflictException(
        'User is already linked to this tenant. Use update to change role.',
      );
    }

    return this.repo.create({ tenantId, userId, role });
  }

  async getMembership(
    tenantId: string,
    userId: string,
  ): Promise<TenantUserEntity> {
    const link = await this.repo.findByTenantAndUser(tenantId, userId);
    if (!link) {
      throw new NotFoundException(
        'No membership found for this user in this tenant.',
      );
    }
    return link;
  }

  async getUserRole(
    userId: string,
    tenantId: string,
  ): Promise<TenantUserRole | null> {
    const link = await this.repo.findByTenantAndUser(tenantId, userId);
    return link?.role ?? null;
  }

  async validateMembership(
    userId: string,
    tenantId: string,
  ): Promise<TenantUserEntity> {
    const link = await this.repo.findByTenantAndUser(tenantId, userId);
    if (!link) {
      throw new ForbiddenException('User is not a member of this tenant.');
    }
    if (link.status !== TenantUserStatus.ACTIVE) {
      throw new ForbiddenException(
        'Membership is inactive. Access to this tenant is denied.',
      );
    }
    return link;
  }

  async removeUserFromTenant(userId: string, tenantId: string): Promise<void> {
    const link = await this.repo.findByTenantAndUser(tenantId, userId);
    if (!link) {
      throw new NotFoundException(
        'No membership found for this user in this tenant.',
      );
    }
    await this.repo.deleteByTenantAndUser(tenantId, userId);
  }
}
