import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  normalizeSlug,
  isValidSlugFormat,
} from '../../../common/utils/slug.utils';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { TenantEntity } from '../entities/tenant.entity';
import { TenantStatus } from '../entities/tenant-status.enum';
import { TenantUserEntity } from '../../tenant-user/entities/tenant-user.entity';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantUserStatus } from '../../tenant-user/entities/tenant-user-status.enum';
import { TenantRepository } from '../../../repository/tenant/tenant.repository';
import { AddressRepository } from 'src/repository/address/address.repository';
import { CreateFreeSubscriptionUseCase } from '../../subscription/use-cases/create-free-subscription.use-case';
@Injectable()
export class CreateTenantWithOwnerUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly tenantRepository: TenantRepository,
    private readonly addressRepository: AddressRepository,
    private readonly createFreeSubscriptionUseCase: CreateFreeSubscriptionUseCase,
  ) {}
  async run(userId: string, dto: CreateTenantDto): Promise<TenantEntity> {
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
    const exists = await this.tenantRepository.existsBySlug(slug);
    if (exists) {
      throw new ConflictException('Slug already in use');
    }
    let addressId: string | null = null;
    try {
      if (dto.address) {
        const address = await this.addressRepository.create(dto.address);
        addressId = address.id;
      }

      return this.dataSource.transaction(async (manager) => {
        const tenantRepo = manager.getRepository(TenantEntity);
        const tenant = tenantRepo.create({
          slug,
          name: dto.name,
          status: TenantStatus.ACTIVE,
          telephone: dto.telephone,
          cnpj: dto.cnpj,
          socialMedia: dto.socialMedia,
        });
        const savedTenant = await tenantRepo.save(tenant);
        const tenantUserRepo = manager.getRepository(TenantUserEntity);
        const tenantUser = tenantUserRepo.create({
          tenantId: savedTenant.id,
          userId,
          role: TenantUserRole.OWNER,
          status: TenantUserStatus.ACTIVE,
        });
        await tenantUserRepo.save(tenantUser);
        await this.createFreeSubscriptionUseCase.run(
          savedTenant.id,
          userId,
          manager,
        );
        return savedTenant;
      });
    } catch (err) {
      if (addressId) await this.addressRepository.softDelete(addressId);
      throw err;
    }
  }
}
