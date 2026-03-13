import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BarberProfileEntity } from '../../modules/barber-profile/entities/barber-profile.entity';
import {
  CreateBarberProfileData,
  IBarberProfileRepository,
  UpdateBarberProfileData,
} from '../../modules/barber-profile/interfaces/barber-profile-repository.interface';

@Injectable()
export class BarberProfileRepository implements IBarberProfileRepository {
  constructor(
    @InjectRepository(BarberProfileEntity)
    private readonly repo: Repository<BarberProfileEntity>,
  ) {}

  async create(data: CreateBarberProfileData): Promise<BarberProfileEntity> {
    const entity = this.repo.create({
      tenantId: data.tenantId,
      tenantUserId: data.tenantUserId,
      displayName: data.displayName,
      bio: data.bio ?? null,
      avatarUrl: data.avatarUrl,
      experienceYears: data.experienceYears,
      isActive: true,
    });
    return this.repo.save(entity);
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<BarberProfileEntity | null> {
    return this.repo.findOne({
      where: { id, tenantId },
      withDeleted: false,
    });
  }

  async findByTenantUserIdNonDeleted(
    tenantId: string,
    tenantUserId: string,
  ): Promise<BarberProfileEntity | null> {
    return this.repo
      .createQueryBuilder('bp')
      .where('bp.tenant_id = :tenantId', { tenantId })
      .andWhere('bp.tenant_user_id = :tenantUserId', { tenantUserId })
      .andWhere('bp.deletedAt IS NULL')
      .getOne();
  }

  async listByTenant(tenantId: string): Promise<BarberProfileEntity[]> {
    return this.repo.find({
      where: { tenantId },
      order: { displayName: 'ASC' },
      withDeleted: false,
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateBarberProfileData,
  ): Promise<BarberProfileEntity> {
    const payload: Partial<BarberProfileEntity> = {};
    if (data.displayName !== undefined) payload.displayName = data.displayName;
    if (data.bio !== undefined) payload.bio = data.bio;
    if (data.avatarUrl !== undefined) payload.avatarUrl = data.avatarUrl;
    if (data.experienceYears !== undefined)
      payload.experienceYears = data.experienceYears;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    await this.repo.update({ id, tenantId }, payload);
    const entity = await this.findById(id, tenantId);
    if (!entity) {
      throw new Error('Barber profile not found after update');
    }
    return entity;
  }

  async softDelete(id: string, tenantId: string): Promise<BarberProfileEntity> {
    const entity = await this.findById(id, tenantId);
    if (!entity) {
      throw new Error('Barber profile not found');
    }
    await this.repo.softDelete({ id, tenantId });
    return entity;
  }
}
