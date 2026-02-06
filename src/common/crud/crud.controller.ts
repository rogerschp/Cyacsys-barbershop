import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { PaginatedOptionsDto } from '../dto/paginated-options.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { CrudService } from './crud.service';
import { ICrudRepository } from '../interfaces/crud-repository.interface';
import { ITenant } from '../interfaces/tenant.interface';

export class CrudController<
  Entity,
  Service extends CrudService<Entity, Repository, Create, Update>,
  Repository extends ICrudRepository<Entity, Create, Update>,
  Create,
  Update,
> {
  constructor(private readonly service: Service) {}

  @Get()
  async findPaginated(
    @Query() paginatedOptions: PaginatedOptionsDto,
    @Req() req: any,
  ): Promise<PaginatedResponseDto<Entity>> {
    return this.service.findPaginated(paginatedOptions, req.tenant.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: ITenant) {
    return this.service.findOne(id, req.tenantId);
  }

  @Post()
  async create(@Body() dto: Create, @Req() req: ITenant) {
    return this.service.create(dto, req.tenantId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Update,
    @Req() req: ITenant,
  ) {
    return this.service.update(id, dto, req.tenantId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: ITenant) {
    return this.service.delete(id, req.tenantId);
  }
}
