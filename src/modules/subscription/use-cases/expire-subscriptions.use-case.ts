import { Inject, Injectable, Logger } from '@nestjs/common';
import { SubscriptionEvent } from '../enums/subscription-event.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import {
  ISubscriptionHistoryRepository,
  SUBSCRIPTION_HISTORY_REPOSITORY,
} from '../interfaces/subscription-history-repository.interface';
import {
  ITenantSubscriptionRepository,
  TENANT_SUBSCRIPTION_REPOSITORY,
} from '../interfaces/tenant-subscription-repository.interface';
import { addDays } from '../utils/subscription.utils';

@Injectable()
export class ExpireSubscriptionsUseCase {
  private readonly logger = new Logger(ExpireSubscriptionsUseCase.name);

  constructor(
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
    @Inject(SUBSCRIPTION_HISTORY_REPOSITORY)
    private readonly subscriptionHistoryRepository: ISubscriptionHistoryRepository,
  ) {}

  async run(): Promise<{ expiredCount: number }> {
    const now = new Date();
    let expiredCount = 0;

    const toGrace =
      await this.tenantSubscriptionRepository.findExpiredActive(now);
    for (const subscription of toGrace) {
      const gracePeriodEnd = addDays(now, subscription.plan.gracePeriodDays);
      await this.tenantSubscriptionRepository.update(subscription.id, {
        status: SubscriptionStatus.GRACE_PERIOD,
        gracePeriodEnd,
      });
      await this.subscriptionHistoryRepository.create({
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        event: SubscriptionEvent.GRACE_STARTED,
        fromPlanId: subscription.planId,
        toPlanId: subscription.planId,
        performedBy: 'system',
      });
    }

    const toExpire =
      await this.tenantSubscriptionRepository.findExpiredGracePeriod(now);
    for (const subscription of toExpire) {
      await this.tenantSubscriptionRepository.update(subscription.id, {
        status: SubscriptionStatus.EXPIRED,
      });
      await this.subscriptionHistoryRepository.create({
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        event: SubscriptionEvent.EXPIRED,
        fromPlanId: subscription.planId,
        toPlanId: subscription.planId,
        performedBy: 'system',
      });
      expiredCount++;
    }

    this.logger.log(
      JSON.stringify({
        event: 'subscriptions_expired',
        count: expiredCount,
        timestamp: now.toISOString(),
      }),
    );

    return { expiredCount };
  }
}
