import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantRepository } from '../../repository/tenant/tenant.repository';
import {
  normalizeSlug,
  isValidSlugFormat,
} from '../../common/utils/slug.utils';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ValidateSlugDto } from './dto/validate-slug.dto';

@Injectable()
export class TenantService {
  constructor(private readonly repo: TenantRepository) {}

  async create(dto: CreateTenantDto) {
    const rawSlug = dto.slug ?? dto.name;
    const slug = normalizeSlug(rawSlug);

    if (!slug) {
      throw new BadRequestException(
        'Could not generate a valid slug from name',
      );
    }
    if (!isValidSlugFormat(slug)) {
      throw new BadRequestException(
        'Slug must be 3-100 chars, lowercase letters, numbers and single hyphens',
      );
    }

    const exists = await this.repo.existsBySlug(slug);
    if (exists) {
      throw new ConflictException('Slug already in use');
    }

    return this.repo.create({ ...dto, slug });
  }

  async validateSlug(dto: ValidateSlugDto) {
    const slug = normalizeSlug(dto.slug);
    if (!slug || !isValidSlugFormat(slug)) {
      return { available: false, reason: 'invalid_format' };
    }
    const exists = await this.repo.existsBySlug(slug);
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
