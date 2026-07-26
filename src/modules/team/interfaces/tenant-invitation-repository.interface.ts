import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantInvitationStatus } from '../enums/tenant-invitation-status.enum';
import { TenantInvitationEntity } from '../entities/tenant-invitation.entity';

export interface CreateTenantInvitationData {
  tenantId: string;
  email: string;
  role: TenantUserRole;
  token: string;
  expiresAt: Date;
  createdByUserId: string;
  status?: TenantInvitationStatus;
}

export interface ITenantInvitationRepository {
  create(data: CreateTenantInvitationData): Promise<TenantInvitationEntity>;
  findPendingByTenantAndEmail(
    tenantId: string,
    email: string,
  ): Promise<TenantInvitationEntity | null>;
  listByTenant(
    tenantId: string,
    status?: TenantInvitationStatus,
  ): Promise<TenantInvitationEntity[]>;
  findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<TenantInvitationEntity | null>;
  updateStatus(
    id: string,
    status: TenantInvitationStatus,
  ): Promise<TenantInvitationEntity>;
}

export const TENANT_INVITATION_REPOSITORY = Symbol(
  'TENANT_INVITATION_REPOSITORY',
);
