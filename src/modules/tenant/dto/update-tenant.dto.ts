import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TenantStatus } from '../entities/tenant-status.enum';

export class UpdateTenantDto {
  @ApiProperty({ example: 'Barbearia do Vitinho', required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: TenantStatus, required: false })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiProperty({
    example: 'America/Sao_Paulo',
    required: false,
    description: 'IANA timezone (ex.: America/Sao_Paulo)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
