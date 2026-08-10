import { ApiProperty } from '@nestjs/swagger';

export class AdminSubscriptionHistoryItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  subscriptionId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  tenantId: string;

  @ApiProperty({ example: 'MANUALLY_ACTIVATED' })
  event: string;

  @ApiProperty({ nullable: true })
  fromPlanId: string | null;

  @ApiProperty({ nullable: true })
  toPlanId: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003' })
  performedBy: string;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;
}
