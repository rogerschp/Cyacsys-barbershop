import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../tenant/interfaces/tenant-repository.interface';
import {
  ITenantSubscriptionRepository,
  TENANT_SUBSCRIPTION_REPOSITORY,
} from '../../subscription/interfaces/tenant-subscription-repository.interface';
import { TenantThemeResponseDto } from '../dto/tenant-theme-response.dto';

@Injectable()
export class GetTenantThemeUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
  ) {}

  async run(tenantId: string): Promise<TenantThemeResponseDto> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found!');
    }

    const subscription =
      await this.tenantSubscriptionRepository.findByTenantIdWithPlan(tenantId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      tenantId: tenant.id,
      theme: tenant.theme,
      plan: subscription.plan.name,
    };
  }
}
