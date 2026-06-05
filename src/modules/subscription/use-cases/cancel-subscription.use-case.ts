import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { SubscriptionResponseDto } from '../dto/subscription-response.dto';
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
import { toSubscriptionResponseDto } from '../mappers/subscription.mapper';

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
    @Inject(SUBSCRIPTION_HISTORY_REPOSITORY)
    private readonly subscriptionHistoryRepository: ISubscriptionHistoryRepository,
  ) {}

  async run(
    tenantId: string,
    performedBy: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription =
      await this.tenantSubscriptionRepository.findByTenantIdWithPlan(tenantId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BusinessRuleException(
        'SUBSCRIPTION_ALREADY_CANCELLED',
        'Assinatura já está cancelada.',
      );
    }

    if (subscription.currentPeriodEnd === null) {
      throw new BusinessRuleException(
        'SUBSCRIPTION_CANNOT_CANCEL_FREE',
        'Plano FREE não pode ser cancelado.',
      );
    }

    const now = new Date();
    await this.tenantSubscriptionRepository.update(subscription.id, {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: now,
    });

    await this.subscriptionHistoryRepository.create({
      tenantId,
      subscriptionId: subscription.id,
      event: SubscriptionEvent.CANCELLED,
      fromPlanId: subscription.planId,
      toPlanId: subscription.planId,
      performedBy,
    });

    const withPlan =
      await this.tenantSubscriptionRepository.findByTenantIdWithPlan(tenantId);
    if (!withPlan) {
      throw new BusinessRuleException(
        'SUBSCRIPTION_NOT_FOUND',
        'Assinatura não encontrada após cancelamento.',
      );
    }

    return toSubscriptionResponseDto(withPlan);
  }
}
