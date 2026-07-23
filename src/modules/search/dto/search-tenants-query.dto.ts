import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { TenantSegment } from 'src/common/enums/tenant-segment.enum';
import { BaseSearchQueryDto } from './base-search-query.dto';

function toOptionalBoolean({ value }: { value: unknown }): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return value;
}

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

  @ApiPropertyOptional({
    description:
      'Filtro por destaque regional do plano (tela de destaques). Quando informado, ordena por nota média primeiro.',
    example: true,
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  regionalHighlight?: boolean;
}
