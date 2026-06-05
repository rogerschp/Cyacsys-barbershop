import { PlanEntity } from '../entities/plan.entity';
import { TenantSubscriptionEntity } from '../entities/tenant-subscription.entity';
import { SubscriptionHistoryEntity } from '../entities/subscription-history.entity';
import { PlanResponseDto } from '../dto/plan-response.dto';
import {
  SubscriptionHistoryResponseDto,
  SubscriptionResponseDto,
} from '../dto/subscription-response.dto';

export function toPlanResponseDto(plan: PlanEntity): PlanResponseDto {
  return {
    id: plan.id,
    name: plan.name,
    billingCycle: plan.billingCycle,
    price: plan.price,
    sortWeight: plan.sortWeight,
    gracePeriodDays: plan.gracePeriodDays,
    features: plan.features,
    isActive: plan.isActive,
  };
}

export function toSubscriptionResponseDto(
  subscription: TenantSubscriptionEntity,
): SubscriptionResponseDto {
  if (!subscription.plan) {
    throw new Error('Subscription plan relation is required');
  }
  return {
    id: subscription.id,
    tenantId: subscription.tenantId,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    gracePeriodEnd: subscription.gracePeriodEnd,
    cancelledAt: subscription.cancelledAt,
    plan: toPlanResponseDto(subscription.plan),
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}

export function toSubscriptionHistoryResponseDto(
  history: SubscriptionHistoryEntity,
): SubscriptionHistoryResponseDto {
  return {
    id: history.id,
    event: history.event,
    fromPlanId: history.fromPlanId,
    toPlanId: history.toPlanId,
    performedBy: history.performedBy,
    createdAt: history.createdAt,
  };
}
