import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { TenantSegment } from 'src/common/enums/tenant-segment.enum';
import { BaseSearchQueryDto } from './base-search-query.dto';

export class SearchTenantsQueryDto extends BaseSearchQueryDto {
  @ApiPropertyOptional({
    enum: TenantSegment,
    description: 'Filtro por segmento do estabelecimento',
    example: TenantSegment.BARBERSHOP,
  })
  @IsOptional()
  @IsEnum(TenantSegment)
  segment?: TenantSegment;

  @ApiPropertyOptional({
    description:
      'Filtro por cidade (correspondência parcial, sem distinção de maiúsculas/acentos)',
    example: 'São Paulo',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtro por UF (2 letras, ex.: SP)',
    example: 'SP',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  state?: string;
}
