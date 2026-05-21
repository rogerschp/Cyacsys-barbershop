import { ApiProperty } from '@nestjs/swagger';
import { ProfessionalProfileResponseDto } from '../../professional-profile/dto/professional-profile-response.dto';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantProfessionalStatus } from '../entities/tenant-professional-status.enum';

export class TenantProfessionalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  professionalProfileId: string;

  @ApiProperty({ enum: TenantUserRole })
  role: TenantUserRole;

  @ApiProperty({ enum: TenantProfessionalStatus })
  status: TenantProfessionalStatus;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty({ nullable: true })
  leftAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({
    type: ProfessionalProfileResponseDto,
    description: 'Perfil profissional global vinculado a este tenant',
  })
  professionalProfile: ProfessionalProfileResponseDto;
}
