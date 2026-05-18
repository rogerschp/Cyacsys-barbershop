import { Injectable } from '@nestjs/common';
import { TenantRepository } from 'src/repository/tenant/tenant.repository';
import { ValidateSlugDto } from '../dto/validate-slug.dto';
import { isValidSlugFormat, normalizeSlug } from 'src/common/utils/slug.utils';

@Injectable()
export class ValidateSlugUseCase {
  constructor(private readonly repo: TenantRepository) {}
  async run(validateSlugDto: ValidateSlugDto) {
    const slug = normalizeSlug(validateSlugDto.slug);
    if (!slug || !isValidSlugFormat(slug)) {
      return { available: false, reason: 'invalid_format' };
    }
    const exists = await this.repo.existsBySlug(slug);
    return { available: !exists };
  }
}
