import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
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
} from '../interfaces/tenant-subscription-repository.interface';

@Injectable()
export class CreateFreeSubscriptionUseCase {
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
    performedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    const freePlan = await this.planRepository.findByName(PlanName.FREE);
    if (!freePlan) {
      throw new BusinessRuleException(
        'PLAN_NOT_FOUND',
        'Plano FREE não encontrado.',
      );
    }

    const subscription = await this.tenantSubscriptionRepository.create(
      {
        tenantId,
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      },
      manager,
    );

    await this.subscriptionHistoryRepository.create(
      {
        tenantId,
        subscriptionId: subscription.id,
        event: SubscriptionEvent.CREATED,
        toPlanId: freePlan.id,
        performedBy,
      },
      manager,
    );
  }
}
