import { Injectable } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { ICrudRepository } from '../interfaces/crud-repository.interface';
import { PaginatedOptionsDto } from '../dto/paginated-options.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

@Injectable()
export abstract class BaseRepository<
  Entity extends { id: string; tenantId: string },
  Create,
  Update,
> implements ICrudRepository<Entity, Create, Update> {
  protected abstract getTableName(): string;
  protected abstract getRepository(): Repository<Entity>;

  abstract findPaginated(
    options: PaginatedOptionsDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<Entity>>;

  abstract findOne(id: string, tenantId: string): Promise<Entity>;

  async create(data: Create, tenantId: string): Promise<Entity> {
    const repository = this.getRepository();

    const entity = repository.create({
      ...(data as unknown as DeepPartial<Entity>),
      tenantId,
    });

    const saved = await repository.save(entity);

    return (Array.isArray(saved) ? saved[0] : saved) as Entity;
  }

  async update(id: string, data: Update, tenantId: string): Promise<Entity> {
    await this.findOne(id, tenantId);

    const repository = this.getRepository();

    await repository.update(
      { id, tenantId } as any,
      data as unknown as Partial<Repository<Entity>['update']>,
    );

    return this.findOne(id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<Entity> {
    const entity = await this.findOne(id, tenantId);
    const repository = this.getRepository();

    await repository.softDelete({ id, tenantId } as any);

    return entity;
  }
}
