import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../../modules/tenant/entities/tenant.entity';
import { TenantStatus } from '../../modules/tenant/entities/tenant-status.enum';
import { CreateTenantDto } from 'src/modules/tenant/dto/create-tenant.dto';
import { UpdateTenantDto } from 'src/modules/tenant/dto/update-tenant.dto';
@Injectable()
export class TenantRepository {
    constructor(
    @InjectRepository(TenantEntity)
    private readonly repo: Repository<TenantEntity>) { }
    create(dto: CreateTenantDto & {
        status?: TenantStatus;
    }) {
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
        return this.repo.findOne({ where: { id: id } });
    }
    update(id: string, dto: UpdateTenantDto) {
        return this.repo.save({ id: id, ...dto });
    }
    softDelete(id: string) {
        return this.repo.softDelete(id);
    }
}
