import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CoordinatesPairConstraint } from 'src/common/validators/coordinates-pair.constraint';
import { IsCnpj } from 'src/common/validators/is-cnpj.decorator';
import { IsPhone } from 'src/common/validators/is-phone.decorator';
import {
  EmptyToUndefined,
  NormalizeCnpj,
  NormalizePhone,
} from 'src/common/transformers/brazilian-document.transformers';
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
    description:
      'Telefone com DDI e DDD. Aceita máscara; normalizado para dígitos.',
  })
  @IsOptional()
  @NormalizePhone()
  @IsString()
  @IsPhone()
  telephone?: string;

  @ApiPropertyOptional({
    example: '11222333000181',
    description:
      'CNPJ com dígitos verificadores. Aceita máscara; normalizado para 14 dígitos.',
  })
  @EmptyToUndefined()
  @NormalizeCnpj()
  @IsOptional()
  @IsString()
  @IsCnpj()
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

  @ApiPropertyOptional({
    description:
      'Permite que o cliente cancele agendamentos CONFIRMED (com antecedência).',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  clientCanCancelConfirmed?: boolean;

  @ApiPropertyOptional({
    example: 60,
    description:
      'Antecedência mínima em minutos antes de startsAt para cancelar CONFIRMED (0–43200). Presets comuns no front: 60, 120, 720, 1440.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(43200)
  clientCancelConfirmedMinLeadMinutes?: number;
}
