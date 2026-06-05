import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantForbiddenException } from '../../../common/exceptions/tenant-forbidden.exception';
import { REQUIRES_PLAN_KEY } from '../decorators/requires-plan.decorator';
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

interface RequestWithTenant {
  tenant?: { id: string };
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<PlanFeature[]>(
      REQUIRES_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeatures?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = request.tenant?.id;
    if (!tenantId) {
      throw new TenantForbiddenException(
        'TENANT_NOT_RESOLVED',
        'Tenant não identificado.',
      );
    }

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

    for (const feature of requiredFeatures) {
      if (!isPlanFeatureEnabled(subscription.plan.features, feature)) {
        throw new TenantForbiddenException(
          'PLAN_FEATURE_NOT_AVAILABLE',
          `Feature '${feature}' não disponível no plano atual.`,
          { tenantId },
        );
      }
    }

    return true;
  }
}
