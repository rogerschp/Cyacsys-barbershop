import { Injectable } from '@nestjs/common';
import { PaginatedOptionsDto } from '../dto/paginated-options.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { ICrudRepository } from '../interfaces/crud-repository.interface';

@Injectable()
export class CrudService<
  Entity,
  Repository extends ICrudRepository<Entity, Create, Update>,
  Create,
  Update,
> {
  constructor(protected readonly repository: Repository) {}

  async findPaginated(
    paginatedOptions: PaginatedOptionsDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<Entity>> {
    return this.repository.findPaginated(paginatedOptions, tenantId);
  }

  async findOne(id: string, tenantId: string): Promise<Entity> {
    return this.repository.findOne(id, tenantId);
  }

  async create(data: Create, tenantId: string): Promise<Entity> {
    return this.repository.create(data, tenantId);
  }

  async update(id: string, data: Update, tenantId: string): Promise<Entity> {
    return this.repository.update(id, data, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<Entity> {
    return this.repository.delete(id, tenantId);
  }
}
