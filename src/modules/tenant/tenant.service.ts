import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantRepository } from '../../repository/tenant/tenant.repository';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ValidateSlugDto } from './dto/validate-slug.dto';

@Injectable()
export class TenantService {
  constructor(private readonly repo: TenantRepository) {}

  async create(dto: CreateTenantDto) {
    const exists = await this.repo.findBySlug(dto.slug);
    if (exists) {
      throw new BadRequestException('Slug already in use');
    }

    return this.repo.create(dto);
  }

  async validateSlug(dto: ValidateSlugDto) {
    const exists = await this.repo.findBySlug(dto.slug);
    return { available: !exists };
  }

  async findById(id: string) {
    const tenant = await this.repo.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.repo.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (dto.slug && dto.slug !== tenant.slug) {
      const slugExists = await this.repo.findBySlug(dto.slug);
      if (slugExists) throw new BadRequestException('Slug already in use');
    }

    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    const tenant = await this.repo.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.repo.softDelete(id);
  }

  async findBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }
}
