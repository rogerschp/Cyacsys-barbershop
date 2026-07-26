import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantUserEntity } from '../../modules/tenant-user/entities/tenant-user.entity';
import { TenantUserRole } from '../../modules/tenant-user/entities/tenant-user-role.enum';
import { TenantUserStatus } from '../../modules/tenant-user/entities/tenant-user-status.enum';
import { ITenantUserRepository } from '../../modules/tenant-user/interfaces/tenant-user-repository.interface';
@Injectable()
export class TenantUserRepository implements ITenantUserRepository {
  constructor(
    @InjectRepository(TenantUserEntity)
    private readonly repo: Repository<TenantUserEntity>,
  ) {}
  async create(data: {
    tenantId: string;
    userId: string;
    role: TenantUserRole;
    status?: TenantUserStatus;
  }): Promise<TenantUserEntity> {
    const entity = this.repo.create({
      tenantId: data.tenantId,
      userId: data.userId,
      role: data.role,
      status: data.status ?? TenantUserStatus.ACTIVE,
    });
    return this.repo.save(entity);
  }
  async findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<TenantUserEntity | null> {
    return this.repo.findOne({ where: { id, tenantId } });
  }
  async findByTenantAndUser(
    tenantId: string,
    userId: string,
  ): Promise<TenantUserEntity | null> {
    return this.repo.findOne({ where: { tenantId, userId } });
  }
  async listActiveByUserId(userId: string): Promise<TenantUserEntity[]> {
    return this.repo.find({
      where: { userId, status: TenantUserStatus.ACTIVE },
      relations: ['tenant', 'tenant.logoMedia'],
      order: { createdAt: 'ASC' },
    });
  }

  async listByTenantId(tenantId: string): Promise<TenantUserEntity[]> {
    return this.repo.find({
      where: { tenantId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async deleteByTenantAndUser(tenantId: string, userId: string): Promise<void> {
    await this.repo.delete({ tenantId, userId });
  }
}
