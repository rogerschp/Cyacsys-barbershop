import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ITenantSubscriptionRepository,
  TENANT_SUBSCRIPTION_REPOSITORY,
} from '../../subscription/interfaces/tenant-subscription-repository.interface';
import { AdminSubscriptionDetailDto } from '../dto/admin-subscription-detail.dto';
import { toAdminSubscriptionDetailDto } from '../mappers/admin-subscription.mapper';

@Injectable()
export class GetAdminSubscriptionUseCase {
  constructor(
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
  ) {}

  async run(tenantId: string): Promise<AdminSubscriptionDetailDto> {
    const subscription =
      await this.tenantSubscriptionRepository.findByTenantIdWithPlan(tenantId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return toAdminSubscriptionDetailDto(subscription);
  }
}
