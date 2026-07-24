import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';

export class OnboardTeamMemberDto {
  @ApiProperty({ example: 'barber@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: TenantUserRole })
  @IsEnum(TenantUserRole)
  @IsNotEmpty()
  role: TenantUserRole;
}
