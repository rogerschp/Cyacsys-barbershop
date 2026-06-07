import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantProfessionalStatus } from '../entities/tenant-professional-status.enum';
import { TenantProfessionalEntity } from '../entities/tenant-professional.entity';

export interface CreateTenantProfessionalData {
  tenantId: string;
  professionalProfileId: string;
  role: TenantUserRole;
  status?: TenantProfessionalStatus;
  joinedAt?: Date;
}

export interface UpdateTenantProfessionalData {
  role?: TenantUserRole;
  status?: TenantProfessionalStatus;
  joinedAt?: Date;
  leftAt?: Date | null;
}

export interface ITenantProfessionalRepository {
  create(data: CreateTenantProfessionalData): Promise<TenantProfessionalEntity>;
  findById(
    id: string,
    tenantId: string,
  ): Promise<TenantProfessionalEntity | null>;
  findByTenantAndProfile(
    tenantId: string,
    professionalProfileId: string,
  ): Promise<TenantProfessionalEntity | null>;
  listByTenant(
    tenantId: string,
    options?: { activeOnly?: boolean },
  ): Promise<TenantProfessionalEntity[]>;
  listActiveTenantIdsByProfessionalProfileId(
    professionalProfileId: string,
  ): Promise<string[]>;
  update(
    id: string,
    tenantId: string,
    data: UpdateTenantProfessionalData,
  ): Promise<TenantProfessionalEntity>;
}

export const TENANT_PROFESSIONAL_REPOSITORY = Symbol(
  'TENANT_PROFESSIONAL_REPOSITORY',
);
