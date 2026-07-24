import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantUserStatus } from '../../tenant-user/entities/tenant-user-status.enum';
import { TenantInvitationStatus } from '../enums/tenant-invitation-status.enum';

export class TeamMemberResponseDto {
  @ApiProperty()
  membershipId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: TenantUserRole })
  role: TenantUserRole;

  @ApiProperty({ enum: TenantUserStatus })
  status: TenantUserStatus;
}

export class TeamInvitationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: TenantUserRole })
  role: TenantUserRole;

  @ApiProperty({ enum: TenantInvitationStatus })
  status: TenantInvitationStatus;

  @ApiProperty()
  expiresAt: string;

  @ApiPropertyOptional({ nullable: true })
  acceptedAt: string | null;

  @ApiProperty()
  createdByUserId: string;

  @ApiProperty()
  createdAt: string;
}

export class OnboardTeamMemberResponseDto {
  @ApiProperty({ enum: ['MEMBER_ADDED', 'INVITATION_CREATED'] })
  kind: 'MEMBER_ADDED' | 'INVITATION_CREATED';

  @ApiPropertyOptional({ type: TeamMemberResponseDto })
  member?: TeamMemberResponseDto;

  @ApiPropertyOptional({ type: TeamInvitationResponseDto })
  invitation?: TeamInvitationResponseDto;

  @ApiPropertyOptional({
    description: 'Preenchido quando BARBER com professional profile foi vinculado',
  })
  tenantProfessionalId?: string;
}
