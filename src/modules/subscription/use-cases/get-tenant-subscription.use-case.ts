import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionResponseDto } from '../dto/subscription-response.dto';
import {
  ITenantSubscriptionRepository,
  TENANT_SUBSCRIPTION_REPOSITORY,
} from '../interfaces/tenant-subscription-repository.interface';
import { toSubscriptionResponseDto } from '../mappers/subscription.mapper';

@Injectable()
export class GetTenantSubscriptionUseCase {
  constructor(
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
  ) {}

  async run(tenantId: string): Promise<SubscriptionResponseDto> {
    const subscription =
      await this.tenantSubscriptionRepository.findByTenantIdWithPlan(tenantId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return toSubscriptionResponseDto(subscription);
  }
}
