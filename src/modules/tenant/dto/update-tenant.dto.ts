import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CoordinatesPairConstraint } from 'src/common/validators/coordinates-pair.constraint';
import { TenantSegment } from 'src/common/enums/tenant-segment.enum';
import { CreateAddressDto } from 'src/modules/address/dto/create-address.dto';
import { TenantStatus } from '../entities/tenant-status.enum';

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

  @ApiPropertyOptional({
    enum: TenantSegment,
    description: 'Segmento do estabelecimento para busca e vitrine',
  })
  @IsOptional()
  @IsEnum(TenantSegment)
  segment?: TenantSegment | null;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.png',
    description: 'URL do avatar/logo do estabelecimento',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl()
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    example: -23.5505199,
    description: 'Latitude para busca geolocalizada (informar com longitude)',
  })
  @IsOptional()
  @Validate(CoordinatesPairConstraint)
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiPropertyOptional({
    example: -46.6333094,
    description: 'Longitude para busca geolocalizada (informar com latitude)',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;
}
