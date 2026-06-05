import { ApiProperty } from '@nestjs/swagger';
import { PlanResponseDto } from './plan-response.dto';

export class SubscriptionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  tenantId: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ nullable: true })
  currentPeriodStart: Date | null;

  @ApiProperty({ nullable: true })
  currentPeriodEnd: Date | null;

  @ApiProperty({ nullable: true })
  gracePeriodEnd: Date | null;

  @ApiProperty({ nullable: true })
  cancelledAt: Date | null;

  @ApiProperty({ type: PlanResponseDto })
  plan: PlanResponseDto;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class SubscriptionHistoryResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'CREATED' })
  event: string;

  @ApiProperty({ nullable: true })
  fromPlanId: string | null;

  @ApiProperty({ nullable: true })
  toPlanId: string | null;

  @ApiProperty({ example: 'system' })
  performedBy: string;

  @ApiProperty({ example: '2021-01-01T00:00:00.000Z' })
  createdAt: Date;
}
