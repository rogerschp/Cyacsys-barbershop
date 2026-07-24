import { TenantInvitationEntity } from '../entities/tenant-invitation.entity';
import { TenantUserEntity } from '../../tenant-user/entities/tenant-user.entity';
import {
  TeamInvitationResponseDto,
  TeamMemberResponseDto,
} from '../dto/team-response.dto';

export function mapInvitationToResponse(
  invitation: TenantInvitationEntity,
): TeamInvitationResponseDto {
  return {
    id: invitation.id,
    tenantId: invitation.tenantId,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt
      ? invitation.acceptedAt.toISOString()
      : null,
    createdByUserId: invitation.createdByUserId,
    createdAt: invitation.createdAt.toISOString(),
  };
}

export function mapMembershipToTeamMember(
  membership: TenantUserEntity,
): TeamMemberResponseDto {
  return {
    membershipId: membership.id,
    userId: membership.userId,
    email: membership.user?.email ?? '',
    name: membership.user?.name ?? '',
    role: membership.role,
    status: membership.status,
  };
}
