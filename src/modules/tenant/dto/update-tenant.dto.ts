import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
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
    description: 'Telefone com DDI e DDD (somente dígitos, 10–15 caracteres)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?\d{10,15}$/, {
    message:
      'Telephone must contain 10 to 15 digits with country code, e.g. 5511992834085',
  })
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
