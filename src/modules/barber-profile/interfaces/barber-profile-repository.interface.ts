import { BarberProfileEntity } from '../entities/barber-profile.entity';

export interface CreateBarberProfileData {
  tenantId: string;
  tenantUserId: string;
  displayName: string;
  bio?: string | null;
  avatarUrl: string;
  experienceYears: number;
}

export interface UpdateBarberProfileData {
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string;
  experienceYears?: number;
  isActive?: boolean;
}

export interface IBarberProfileRepository {
  create(data: CreateBarberProfileData): Promise<BarberProfileEntity>;

  findById(id: string, tenantId: string): Promise<BarberProfileEntity | null>;

  findByTenantUserIdNonDeleted(
    tenantId: string,
    tenantUserId: string,
  ): Promise<BarberProfileEntity | null>;

  listByTenant(tenantId: string): Promise<BarberProfileEntity[]>;

  update(
    id: string,
    tenantId: string,
    data: UpdateBarberProfileData,
  ): Promise<BarberProfileEntity>;

  softDelete(id: string, tenantId: string): Promise<BarberProfileEntity>;
}

export const BARBER_PROFILE_REPOSITORY = Symbol('BARBER_PROFILE_REPOSITORY');
