import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminTenantSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Barbearia do Vitinho' })
  name: string;

  @ApiProperty({ example: 'barbearia-do-vitinho' })
  slug: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}

export class AdminPlanSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  id: string;

  @ApiProperty({ example: 'PRO' })
  name: string;

  @ApiProperty({ example: 'MONTHLY' })
  billingCycle: string;

  @ApiPropertyOptional({ example: '149.90' })
  price?: string;

  @ApiPropertyOptional({ example: 5 })
  gracePeriodDays?: number;
}

export class AdminSubscriptionSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ nullable: true })
  currentPeriodStart: Date | null;

  @ApiProperty({ nullable: true })
  currentPeriodEnd: Date | null;

  @ApiProperty({ nullable: true })
  gracePeriodEnd: Date | null;

  @ApiPropertyOptional({ nullable: true })
  cancelledAt?: Date | null;
}

export class AdminSubscriptionListItemDto {
  @ApiProperty({ type: AdminTenantSummaryDto })
  tenant: AdminTenantSummaryDto;

  @ApiProperty({ type: AdminSubscriptionSummaryDto })
  subscription: AdminSubscriptionSummaryDto;

  @ApiProperty({ type: AdminPlanSummaryDto })
  plan: AdminPlanSummaryDto;
}
