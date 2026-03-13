import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TenantStatus } from '../entities/tenant-status.enum';

export class UpdateTenantDto {
  @ApiProperty({ example: 'Barbearia do Vitinho', required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: TenantStatus, required: false })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
