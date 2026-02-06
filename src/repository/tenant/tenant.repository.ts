import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../../modules/tenant/entities/tenant.entity';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repo: Repository<TenantEntity>,
  ) {}

  findBySlug(slug: string): Promise<TenantEntity | null> {
    return this.repo.findOne({ where: { slug } });
  }
}
