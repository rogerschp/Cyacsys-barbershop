import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from '../../modules/service/entities/service.entity';
import {
  CreateServiceData,
  IServiceRepository,
  UpdateServiceData,
} from '../../modules/service/interfaces/service-repository.interface';
@Injectable()
export class ServiceRepository implements IServiceRepository {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly repo: Repository<ServiceEntity>,
  ) {}
  async create(data: CreateServiceData): Promise<ServiceEntity> {
    const entity = this.repo.create({
      tenantId: data.tenantId,
      name: data.name,
      description: data.description ?? null,
      price: data.price,
      durationInMinutes: data.durationInMinutes,
      isActive: true,
    });
    return this.repo.save(entity);
  }
  async findById(id: string, tenantId: string): Promise<ServiceEntity | null> {
    return this.repo.findOne({
      where: { id, tenantId },
      withDeleted: false,
    });
  }
  async findNonDeletedByName(
    tenantId: string,
    name: string,
    excludeId?: string,
  ): Promise<ServiceEntity | null> {
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.tenant_id = :tenantId', { tenantId })
      .andWhere('LOWER(TRIM(s.name)) = LOWER(TRIM(:name))', { name })
      .andWhere('s.deletedAt IS NULL');
    if (excludeId) {
      qb.andWhere('s.id != :excludeId', { excludeId });
    }
    return qb.getOne();
  }
  async listByTenant(tenantId: string): Promise<ServiceEntity[]> {
    return this.repo.find({
      where: { tenantId },
      order: { name: 'ASC' },
      withDeleted: false,
    });
  }
  async update(
    id: string,
    tenantId: string,
    data: UpdateServiceData,
  ): Promise<ServiceEntity> {
    const payload: Partial<ServiceEntity> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.price !== undefined) payload.price = data.price;
    if (data.durationInMinutes !== undefined)
      payload.durationInMinutes = data.durationInMinutes;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    await this.repo.update({ id, tenantId }, payload);
    const entity = await this.findById(id, tenantId);
    if (!entity) {
      throw new Error('Service not found after update');
    }
    return entity;
  }
  async softDelete(id: string, tenantId: string): Promise<ServiceEntity> {
    const entity = await this.findById(id, tenantId);
    if (!entity) {
      throw new Error('Service not found');
    }
    await this.repo.softDelete({ id, tenantId });
    return entity;
  }
}
