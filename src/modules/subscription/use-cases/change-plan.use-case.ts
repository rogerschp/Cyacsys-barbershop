import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { SubscriptionResponseDto } from '../dto/subscription-response.dto';
import { PlanName } from '../enums/plan-name.enum';
import { SubscriptionEvent } from '../enums/subscription-event.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import {
  IPlanRepository,
  PLAN_REPOSITORY,
} from '../interfaces/plan-repository.interface';
import {
  ISubscriptionHistoryRepository,
  SUBSCRIPTION_HISTORY_REPOSITORY,
} from '../interfaces/subscription-history-repository.interface';
import {
  ITenantSubscriptionRepository,
  TENANT_SUBSCRIPTION_REPOSITORY,
  UpdateTenantSubscriptionData,
} from '../interfaces/tenant-subscription-repository.interface';
import { toSubscriptionResponseDto } from '../mappers/subscription.mapper';
import { calculatePeriodEnd } from '../utils/subscription.utils';
import { BillingCycle } from '../enums/billing-cycle.enum';

@Injectable()
export class ChangePlanUseCase {
  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly planRepository: IPlanRepository,
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
    @Inject(SUBSCRIPTION_HISTORY_REPOSITORY)
    private readonly subscriptionHistoryRepository: ISubscriptionHistoryRepository,
  ) {}

  async run(
    tenantId: string,
    newPlanName: PlanName,
    billingCycle: BillingCycle,
    performedBy: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription =
      await this.tenantSubscriptionRepository.findByTenantIdWithPlan(tenantId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const newPlan = await this.planRepository.findByName(newPlanName);
    if (!newPlan) {
      throw new BusinessRuleException(
        'PLAN_NOT_FOUND',
        'Plano não encontrado.',
      );
    }

    if (newPlan.id === subscription.planId) {
      throw new BusinessRuleException(
        'SAME_PLAN',
        'O tenant já está neste plano.',
      );
    }

    const currentPlan = subscription.plan;
    const isUpgrade = newPlan.sortWeight > currentPlan.sortWeight;
    const now = new Date();

    let updateData: UpdateTenantSubscriptionData;
    let event: SubscriptionEvent;

    if (isUpgrade) {
      const periodStart = newPlan.name === PlanName.FREE ? null : now;
      const periodEnd =
        newPlan.name === PlanName.FREE
          ? null
          : calculatePeriodEnd(now, billingCycle);
      updateData = {
        planId: newPlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        gracePeriodEnd: null,
        cancelledAt: null,
      };
      event = SubscriptionEvent.UPGRADED;
    } else {
      updateData = {
        planId: newPlan.id,
      };
      event = SubscriptionEvent.DOWNGRADED;
    }

    await this.tenantSubscriptionRepository.update(subscription.id, updateData);

    await this.subscriptionHistoryRepository.create({
      tenantId,
      subscriptionId: subscription.id,
      event,
      fromPlanId: subscription.planId,
      toPlanId: newPlan.id,
      performedBy,
    });

    const withPlan =
      await this.tenantSubscriptionRepository.findByTenantIdWithPlan(tenantId);
    if (!withPlan) {
      throw new BusinessRuleException(
        'SUBSCRIPTION_NOT_FOUND',
        'Assinatura não encontrada após alteração de plano.',
      );
    }

    return toSubscriptionResponseDto(withPlan);
  }
}
