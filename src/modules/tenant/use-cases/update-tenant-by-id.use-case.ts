import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { FindTenantByIdUseCase } from './find-tenant-by-id.use-case';
import { TenantResponseDto } from '../dto/tenant-response.dto';

@Injectable()
export class UpdateTenantByIdUseCase {
  constructor(
    private readonly repo: TenantRepository,
    private readonly findTenantById: FindTenantByIdUseCase,
  ) {}
  async run(
    id: string,
    updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    const tenant = await this.findTenantById.run(id);
    if (!tenant) throw new NotFoundException('Tenant not found!');
    return this.repo.update(id, updateTenantDto);
  }
}
