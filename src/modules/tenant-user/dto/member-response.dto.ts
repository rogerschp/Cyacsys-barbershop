import { ApiProperty } from '@nestjs/swagger';
import { TenantUserRole } from '../entities/tenant-user-role.enum';
import { TenantUserStatus } from '../entities/tenant-user-status.enum';
export class MemberResponseDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;
    @ApiProperty({ description: 'ID do tenant' })
    tenantId: string;
    @ApiProperty({ description: 'ID do usuário' })
    userId: string;
    @ApiProperty({ enum: TenantUserRole })
    role: TenantUserRole;
    @ApiProperty({ enum: TenantUserStatus })
    status: TenantUserStatus;
    @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
    createdAt: Date;
}
