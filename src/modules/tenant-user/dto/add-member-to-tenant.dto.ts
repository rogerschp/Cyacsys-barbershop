import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { TenantUserRole } from '../entities/tenant-user-role.enum';

export class AddMemberToTenantDto {
  @ApiProperty({ description: 'UUID do usuário a vincular ao tenant' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    enum: TenantUserRole,
    description:
      'Papel do usuário neste tenant (OWNER | ADMIN | BARBER | STAFF)',
  })
  @IsEnum(TenantUserRole)
  @IsNotEmpty()
  role: TenantUserRole;
}
