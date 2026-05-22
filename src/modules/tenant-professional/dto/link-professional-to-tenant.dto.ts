import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';

export class LinkProfessionalToTenantDto {
  @ApiProperty({
    description: 'UUID do perfil profissional global a vincular ao tenant',
  })
  @IsUUID()
  @IsNotEmpty()
  professionalProfileId: string;

  @ApiProperty({
    enum: TenantUserRole,
    description:
      'Papel operacional neste tenant (tipicamente BARBER ou OWNER)',
    example: TenantUserRole.BARBER,
  })
  @IsEnum(TenantUserRole)
  @IsNotEmpty()
  role: TenantUserRole;
}
