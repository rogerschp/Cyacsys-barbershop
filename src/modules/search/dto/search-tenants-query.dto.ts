import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
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
}
