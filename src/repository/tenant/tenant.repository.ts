import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../../modules/tenant/entities/tenant.entity';
import { CreateTenantDto } from 'src/modules/tenant/dto/create-tenant.dto';
import { UpdateTenantDto } from 'src/modules/tenant/dto/update-tenant.dto';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repo: Repository<TenantEntity>,
  ) {}

  create(dto: CreateTenantDto) {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id: id } });
  }

  update(id: string, dto: UpdateTenantDto) {
    return this.repo.save({ id: id, ...dto });
  }

  softDelete(id: string) {
    return this.repo.softDelete(id);
  }
}
