import { ApiProperty } from '@nestjs/swagger';
import { TenantSegment } from 'src/common/enums/tenant-segment.enum';

export class TenantSearchPlanDto {
  @ApiProperty({ example: 'PRO' })
  name: string;

  @ApiProperty({ example: false })
  eliteBadge: boolean;

  @ApiProperty({ example: true })
  regionalHighlight: boolean;
}

export class TenantSearchResultDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Barbearia do Vitinho' })
  name: string;

  @ApiProperty({
    nullable: true,
    example: 'https://cdn.example.com/avatar.png',
  })
  avatarUrl: string | null;

  @ApiProperty({ example: 4.5 })
  averageRating: number;

  @ApiProperty({ example: 12 })
  totalReviews: number;

  @ApiProperty({ nullable: true, example: 2.3 })
  distanceKm: number | null;

  @ApiProperty({ example: 'barbearia-do-vitinho' })
  slug: string;

  @ApiProperty({ enum: TenantSegment, nullable: true })
  segment: TenantSegment | null;

  @ApiProperty({ nullable: true, example: 'São Paulo' })
  city: string | null;

  @ApiProperty({ type: TenantSearchPlanDto })
  plan: TenantSearchPlanDto;
}

export class TenantSearchResponseDto {
  @ApiProperty({ type: [TenantSearchResultDto] })
  data: TenantSearchResultDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}
