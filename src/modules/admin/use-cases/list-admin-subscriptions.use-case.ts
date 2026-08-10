import { Inject, Injectable } from '@nestjs/common';
import { PaginatedOptionsDto } from '../../../common/dto/paginated-options.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import {
  ITenantSubscriptionRepository,
  TENANT_SUBSCRIPTION_REPOSITORY,
} from '../../subscription/interfaces/tenant-subscription-repository.interface';
import { AdminSubscriptionListItemDto } from '../dto/admin-subscription-list-item.dto';
import { toAdminSubscriptionListItemDto } from '../mappers/admin-subscription.mapper';

@Injectable()
export class ListAdminSubscriptionsUseCase {
  constructor(
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
  ) {}

  async run(
    options: PaginatedOptionsDto,
  ): Promise<PaginatedResponseDto<AdminSubscriptionListItemDto>> {
    const page =
      await this.tenantSubscriptionRepository.findPaginatedWithPlanAndTenant(
        options,
      );
    return new PaginatedResponseDto(
      {
        data: page.data.map(toAdminSubscriptionListItemDto),
        total: page.total,
      },
      { first: page.first, rows: page.rows },
    );
  }
}
