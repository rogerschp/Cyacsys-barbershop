import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { BillingCycle } from '../enums/billing-cycle.enum';
import { PlanName } from '../enums/plan-name.enum';

export class ActivateSubscriptionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ enum: PlanName, example: PlanName.STANDARD })
  @IsEnum(PlanName)
  planName: PlanName;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;
}
