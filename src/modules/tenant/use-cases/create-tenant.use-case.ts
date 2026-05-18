import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { isValidSlugFormat, normalizeSlug } from 'src/common/utils/slug.utils';
import { CreateTenantDto } from '../dto/create-tenant.dto';

@Injectable()
export class CreateTenantUseCase {
  constructor(private readonly repo: TenantRepository) {}

  async run(dto: CreateTenantDto) {
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
}
