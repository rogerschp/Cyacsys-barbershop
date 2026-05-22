import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantProfessionalStatus } from '../../modules/tenant-professional/entities/tenant-professional-status.enum';
import { TenantProfessionalEntity } from '../../modules/tenant-professional/entities/tenant-professional.entity';
import {
  CreateTenantProfessionalData,
  ITenantProfessionalRepository,
  UpdateTenantProfessionalData,
} from '../../modules/tenant-professional/interfaces/tenant-professional-repository.interface';

@Injectable()
export class TenantProfessionalRepository implements ITenantProfessionalRepository {
  constructor(
    @InjectRepository(TenantProfessionalEntity)
    private readonly repo: Repository<TenantProfessionalEntity>,
  ) {}

  async create(
    data: CreateTenantProfessionalData,
  ): Promise<TenantProfessionalEntity> {
    const entity = this.repo.create({
      tenantId: data.tenantId,
      professionalProfileId: data.professionalProfileId,
      role: data.role,
      status: data.status ?? TenantProfessionalStatus.ACTIVE,
      joinedAt: data.joinedAt ?? new Date(),
      leftAt: null,
    });
    const saved = await this.repo.save(entity);
    const loaded = await this.findById(saved.id, saved.tenantId);
    if (!loaded) {
      throw new Error('Tenant professional not found after create');
    }
    return loaded;
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<TenantProfessionalEntity | null> {
    return this.repo.findOne({
      where: { id, tenantId },
      relations: { professionalProfile: true },
    });
  }

  async findByTenantAndProfile(
    tenantId: string,
    professionalProfileId: string,
  ): Promise<TenantProfessionalEntity | null> {
    return this.repo.findOne({
      where: { tenantId, professionalProfileId },
      relations: { professionalProfile: true },
    });
  }

  async listByTenant(
    tenantId: string,
    options?: { activeOnly?: boolean },
  ): Promise<TenantProfessionalEntity[]> {
    const qb = this.repo
      .createQueryBuilder('tp')
      .innerJoinAndSelect('tp.professionalProfile', 'pp')
      .where('tp.tenant_id = :tenantId', { tenantId })
      .andWhere('pp.deletedAt IS NULL')
      .orderBy('tp.joined_at', 'DESC');

    if (options?.activeOnly) {
      qb.andWhere('tp.status = :status', {
        status: TenantProfessionalStatus.ACTIVE,
      }).andWhere('pp.is_active = true');
    }

    return qb.getMany();
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateTenantProfessionalData,
  ): Promise<TenantProfessionalEntity> {
    const payload: Partial<TenantProfessionalEntity> = {};
    if (data.role !== undefined) {
      payload.role = data.role;
    }
    if (data.status !== undefined) {
      payload.status = data.status;
    }
    if (data.joinedAt !== undefined) {
      payload.joinedAt = data.joinedAt;
    }
    if (data.leftAt !== undefined) {
      payload.leftAt = data.leftAt;
    }
    await this.repo.update({ id, tenantId }, payload);
    const entity = await this.findById(id, tenantId);
    if (!entity) {
      throw new Error('Tenant professional not found after update');
    }
    return entity;
  }
}
