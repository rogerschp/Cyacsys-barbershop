import { TenantUserEntity } from '../entities/tenant-user.entity';
import { TenantUserRole } from '../entities/tenant-user-role.enum';
import { TenantUserStatus } from '../entities/tenant-user-status.enum';

export interface ITenantUserRepository {
  create(data: {
    tenantId: string;
    userId: string;
    role: TenantUserRole;
    status?: TenantUserStatus;
  }): Promise<TenantUserEntity>;

  findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<TenantUserEntity | null>;

  findByTenantAndUser(
    tenantId: string,
    userId: string,
  ): Promise<TenantUserEntity | null>;

  deleteByTenantAndUser(tenantId: string, userId: string): Promise<void>;
}

export const TENANT_USER_REPOSITORY = Symbol('TENANT_USER_REPOSITORY');
