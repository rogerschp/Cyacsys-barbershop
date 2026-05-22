import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TenantStatus } from '../entities/tenant-status.enum';
import { CreateAddressDto } from 'src/modules/address/dto/create-address.dto';
import { Type } from 'class-transformer';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Barbearia do Vitinho' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiPropertyOptional({
    example: 'America/Sao_Paulo',
    description: 'IANA timezone (ex.: America/Sao_Paulo)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ type: CreateAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  @ApiPropertyOptional({
    example: '5511992834085',
    description: 'Telefone para contato',
  })
  @IsOptional()
  @IsPhoneNumber() // Removido IsNotEmpty para permitir updates parciais
  telephone?: string;

  @ApiPropertyOptional({
    example: '12345678000199',
    description: 'CNPJ apenas números',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter exatamente 14 números' })
  cnpj?: string;

  @ApiPropertyOptional({
    example: { instagram: 'vitinho_barber', facebook: 'barbeariavitinho' },
    description: 'Redes sociais da barbearia',
  })
  @IsOptional()
  @IsObject()
  socialMedia?: Record<string, string>;
}
