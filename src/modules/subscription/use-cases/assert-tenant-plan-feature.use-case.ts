import { Inject, Injectable } from '@nestjs/common';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import { PlanFeature } from '../enums/plan-feature.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import {
  ITenantSubscriptionRepository,
  TENANT_SUBSCRIPTION_REPOSITORY,
} from '../interfaces/tenant-subscription-repository.interface';
import {
  isPlanFeatureEnabled,
  isSubscriptionAccessAllowed,
} from '../utils/subscription.utils';

@Injectable()
export class AssertTenantPlanFeatureUseCase {
  constructor(
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
  ) {}

  async run(tenantId: string, feature: PlanFeature): Promise<void> {
    const subscription =
      await this.tenantSubscriptionRepository.findByTenantIdWithPlan(tenantId);

    if (!subscription) {
      throw new TenantForbiddenException(
        'SUBSCRIPTION_NOT_FOUND',
        'Assinatura não encontrada.',
        { tenantId },
      );
    }

    if (subscription.status === SubscriptionStatus.EXPIRED) {
      throw new TenantForbiddenException(
        'SUBSCRIPTION_EXPIRED',
        'Assinatura expirada.',
        { tenantId },
      );
    }

    if (
      !isSubscriptionAccessAllowed(
        subscription.status,
        subscription.currentPeriodEnd,
      )
    ) {
      throw new TenantForbiddenException(
        'SUBSCRIPTION_EXPIRED',
        'Assinatura expirada.',
        { tenantId },
      );
    }

    if (!isPlanFeatureEnabled(subscription.plan.features, feature)) {
      throw new TenantForbiddenException(
        'PLAN_FEATURE_NOT_AVAILABLE',
        `Feature '${feature}' não disponível no plano atual.`,
        { tenantId },
      );
    }
  }
}
