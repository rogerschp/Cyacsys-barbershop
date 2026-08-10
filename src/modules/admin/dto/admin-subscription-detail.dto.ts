import { ApiProperty } from '@nestjs/swagger';
import {
  AdminPlanSummaryDto,
  AdminSubscriptionSummaryDto,
  AdminTenantSummaryDto,
} from './admin-subscription-list-item.dto';

export class AdminSubscriptionDetailDto {
  @ApiProperty({ type: AdminTenantSummaryDto })
  tenant: AdminTenantSummaryDto;

  @ApiProperty({ type: AdminSubscriptionSummaryDto })
  subscription: AdminSubscriptionSummaryDto;

  @ApiProperty({ type: AdminPlanSummaryDto })
  plan: AdminPlanSummaryDto;
}
