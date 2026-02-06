import { PaginatedOptionsDto } from '../dto/paginated-options.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

export interface ICrudRepository<Entity, Create, Update> {
  findPaginated(
    options: PaginatedOptionsDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<Entity>>;

  findOne(id: string, tenantId: string): Promise<Entity>;

  create(data: Create, tenantId: string): Promise<Entity>;

  update(id: string, data: Update, tenantId: string): Promise<Entity>;

  delete(id: string, tenantId: string): Promise<Entity>;
}
