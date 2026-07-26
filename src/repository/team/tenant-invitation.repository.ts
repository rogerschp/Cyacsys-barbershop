import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantInvitationEntity } from '../../modules/team/entities/tenant-invitation.entity';
import { TenantInvitationStatus } from '../../modules/team/enums/tenant-invitation-status.enum';
import {
  CreateTenantInvitationData,
  ITenantInvitationRepository,
} from '../../modules/team/interfaces/tenant-invitation-repository.interface';

@Injectable()
export class TenantInvitationRepository implements ITenantInvitationRepository {
  constructor(
    @InjectRepository(TenantInvitationEntity)
    private readonly repo: Repository<TenantInvitationEntity>,
  ) {}

  async create(
    data: CreateTenantInvitationData,
  ): Promise<TenantInvitationEntity> {
    const entity = this.repo.create({
      tenantId: data.tenantId,
      email: data.email,
      role: data.role,
      token: data.token,
      expiresAt: data.expiresAt,
      createdByUserId: data.createdByUserId,
      status: data.status ?? TenantInvitationStatus.PENDING,
      acceptedAt: null,
    });
    return this.repo.save(entity);
  }

  async findPendingByTenantAndEmail(
    tenantId: string,
    email: string,
  ): Promise<TenantInvitationEntity | null> {
    return this.repo.findOne({
      where: {
        tenantId,
        email,
        status: TenantInvitationStatus.PENDING,
      },
    });
  }

  async listByTenant(
    tenantId: string,
    status?: TenantInvitationStatus,
  ): Promise<TenantInvitationEntity[]> {
    return this.repo.find({
      where: status ? { tenantId, status } : { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<TenantInvitationEntity | null> {
    return this.repo.findOne({ where: { id, tenantId } });
  }

  async updateStatus(
    id: string,
    status: TenantInvitationStatus,
  ): Promise<TenantInvitationEntity> {
    await this.repo.update({ id }, { status });
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) {
      throw new Error('TENANT_INVITATION_NOT_FOUND');
    }
    return updated;
  }
}
