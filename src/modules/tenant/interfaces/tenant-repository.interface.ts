import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { TenantEntity } from '../entities/tenant.entity';
import { TenantStatus } from '../entities/tenant-status.enum';
import { TenantThemeData } from '../../tenant-theme/interfaces/tenant-theme-data.interface';

export interface ITenantRepository {
  create(
    dto: CreateTenantDto & {
      status?: TenantStatus;
    },
  ): Promise<TenantEntity>;
  findBySlug(slug: string): Promise<TenantEntity | null>;
  existsBySlug(slug: string): Promise<boolean>;
  findById(id: string): Promise<TenantEntity | null>;
  update(id: string, dto: UpdateTenantDto): Promise<TenantEntity>;
  updateTheme(id: string, theme: TenantThemeData | null): Promise<void>;
  softDelete(id: string): Promise<void>;
}

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');
