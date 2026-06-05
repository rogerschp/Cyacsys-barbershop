import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../../modules/tenant/entities/tenant.entity';
import { TenantStatus } from '../../modules/tenant/entities/tenant-status.enum';
import { CreateTenantDto } from '../../modules/tenant/dto/create-tenant.dto';
import { UpdateTenantDto } from '../../modules/tenant/dto/update-tenant.dto';
import { ITenantRepository } from '../../modules/tenant/interfaces/tenant-repository.interface';
import { TenantThemeData } from '../../modules/tenant-theme/interfaces/tenant-theme-data.interface';

@Injectable()
export class TenantRepository implements ITenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repo: Repository<TenantEntity>,
  ) {}

  create(
    dto: CreateTenantDto & {
      status?: TenantStatus;
    },
  ) {
    const entity = this.repo.create({
      ...dto,
      status: dto.status ?? TenantStatus.ACTIVE,
    });
    return this.repo.save(entity);
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  existsBySlug(slug: string) {
    return this.repo
      .createQueryBuilder('t')
      .withDeleted()
      .where('t.slug = :slug', { slug })
      .getExists();
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateTenantDto) {
    return this.repo.save({ id, ...dto });
  }

  async updateTheme(id: string, theme: TenantThemeData | null): Promise<void> {
    await this.repo.update(id, { theme });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
