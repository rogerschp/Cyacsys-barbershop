import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import { TenantSubscriptionEntity } from '../entities/tenant-subscription.entity';
import { ActivateSubscriptionDto } from '../dto/activate-subscription.dto';
import { SubscriptionResponseDto } from '../dto/subscription-response.dto';
import { BillingCycle } from '../enums/billing-cycle.enum';
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
import { toSubscriptionResponseDto } from '../mappers/subscription.mapper';
import { calculatePeriodEnd } from '../utils/subscription.utils';

@Injectable()
export class ActivateSubscriptionUseCase {
  private readonly logger = new Logger(ActivateSubscriptionUseCase.name);

  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly planRepository: IPlanRepository,
    @Inject(TENANT_SUBSCRIPTION_REPOSITORY)
    private readonly tenantSubscriptionRepository: ITenantSubscriptionRepository,
    @Inject(SUBSCRIPTION_HISTORY_REPOSITORY)
    private readonly subscriptionHistoryRepository: ISubscriptionHistoryRepository,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(
    dto: ActivateSubscriptionDto,
    activatedBy: string,
  ): Promise<SubscriptionResponseDto> {
    try {
      await this.findTenantByIdUseCase.run(dto.tenantId);
    } catch {
      throw new NotFoundException('Tenant not found');
    }

    const plan = await this.planRepository.findByName(dto.planName);
    if (!plan) {
      throw new BusinessRuleException(
        'PLAN_NOT_FOUND',
        'Plano não encontrado.',
      );
    }

    if (plan.name === PlanName.FREE && dto.billingCycle !== BillingCycle.NONE) {
      throw new BusinessRuleException(
        'INVALID_BILLING_CYCLE',
        'Plano FREE requer billingCycle NONE.',
      );
    }

    if (plan.name !== PlanName.FREE && dto.billingCycle === BillingCycle.NONE) {
      throw new BusinessRuleException(
        'INVALID_BILLING_CYCLE',
        'Planos pagos requerem billingCycle MONTHLY ou ANNUAL.',
      );
    }

    const now = new Date();
    const periodStart = plan.name === PlanName.FREE ? null : now;
    const periodEnd =
      plan.name === PlanName.FREE
        ? null
        : calculatePeriodEnd(now, dto.billingCycle);

    const existing =
      await this.tenantSubscriptionRepository.findByTenantIdWithPlan(
        dto.tenantId,
      );

    let subscription: TenantSubscriptionEntity | null;
    if (existing) {
      subscription = await this.tenantSubscriptionRepository.update(
        existing.id,
        {
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          gracePeriodEnd: null,
          cancelledAt: null,
          activatedBy,
        },
      );
    } else {
      subscription = await this.tenantSubscriptionRepository.create({
        tenantId: dto.tenantId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        activatedBy,
      });
      subscription =
        await this.tenantSubscriptionRepository.findByTenantIdWithPlan(
          dto.tenantId,
        );
    }

    if (!subscription) {
      throw new BusinessRuleException(
        'SUBSCRIPTION_NOT_FOUND',
        'Assinatura não encontrada após ativação.',
      );
    }

    await this.subscriptionHistoryRepository.create({
      tenantId: dto.tenantId,
      subscriptionId: subscription.id,
      event: SubscriptionEvent.MANUALLY_ACTIVATED,
      fromPlanId: existing?.planId ?? null,
      toPlanId: plan.id,
      performedBy: activatedBy,
    });

    this.logger.log(
      JSON.stringify({
        event: 'subscription_manually_activated',
        tenantId: dto.tenantId,
        planName: dto.planName,
        activatedBy,
        timestamp: now.toISOString(),
      }),
    );

    return toSubscriptionResponseDto(subscription);
  }
}
