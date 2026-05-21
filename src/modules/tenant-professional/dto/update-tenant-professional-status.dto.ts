import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TenantProfessionalStatus } from '../entities/tenant-professional-status.enum';

export class UpdateTenantProfessionalStatusDto {
  @ApiProperty({ enum: TenantProfessionalStatus })
  @IsEnum(TenantProfessionalStatus)
  @IsNotEmpty()
  status: TenantProfessionalStatus;
}
