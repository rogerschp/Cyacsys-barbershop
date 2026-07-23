import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantSegment } from 'src/common/enums/tenant-segment.enum';
import { TenantUserRole } from '../entities/tenant-user-role.enum';
import { TenantUserStatus } from '../entities/tenant-user-status.enum';

export class MyTenantSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  telephone: string;

  @ApiProperty()
  timezone: string;

  @ApiPropertyOptional({ enum: TenantSegment, nullable: true })
  segment?: TenantSegment | null;

  @ApiPropertyOptional({ nullable: true })
  logoMediaId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ default: false })
  clientCanCancelConfirmed: boolean;

  @ApiProperty({ example: 60, default: 60 })
  clientCancelConfirmedMinLeadMinutes: number;
}

export class MyTenantResponseDto {
  @ApiProperty({ description: 'ID do vínculo tenant_users' })
  membershipId: string;

  @ApiProperty({ enum: TenantUserRole })
  role: TenantUserRole;

  @ApiProperty({ enum: TenantUserStatus })
  status: TenantUserStatus;

  @ApiProperty({ type: MyTenantSummaryDto })
  tenant: MyTenantSummaryDto;
}
