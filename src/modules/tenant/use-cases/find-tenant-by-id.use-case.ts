import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { TenantResponseDto } from '../dto/tenant-response.dto';

@Injectable()
export class FindTenantByIdUseCase {
  constructor(private readonly repo: TenantRepository) {}

  async run(id: string): Promise<TenantResponseDto> {
    const tenant = await this.repo.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found!');
    return tenant;
  }
}
