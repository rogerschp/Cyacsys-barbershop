import { TenantSubscriptionEntity } from '../../subscription/entities/tenant-subscription.entity';
import { SubscriptionHistoryEntity } from '../../subscription/entities/subscription-history.entity';
import { AdminSubscriptionDetailDto } from '../dto/admin-subscription-detail.dto';
import { AdminSubscriptionHistoryItemDto } from '../dto/admin-subscription-history-item.dto';
import { AdminSubscriptionListItemDto } from '../dto/admin-subscription-list-item.dto';

function assertPlanAndTenant(subscription: TenantSubscriptionEntity): void {
  if (!subscription.plan) {
    throw new Error('Subscription plan relation is required');
  }
  if (!subscription.tenant) {
    throw new Error('Subscription tenant relation is required');
  }
}

export function toAdminSubscriptionListItemDto(
  subscription: TenantSubscriptionEntity,
): AdminSubscriptionListItemDto {
  assertPlanAndTenant(subscription);
  return {
    tenant: {
      id: subscription.tenant.id,
      name: subscription.tenant.name,
      slug: subscription.tenant.slug,
      status: subscription.tenant.status,
    },
    subscription: {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      gracePeriodEnd: subscription.gracePeriodEnd,
      cancelledAt: subscription.cancelledAt,
    },
    plan: {
      id: subscription.plan.id,
      name: subscription.plan.name,
      billingCycle: subscription.plan.billingCycle,
      price: subscription.plan.price,
      gracePeriodDays: subscription.plan.gracePeriodDays,
    },
  };
}

export function toAdminSubscriptionDetailDto(
  subscription: TenantSubscriptionEntity,
): AdminSubscriptionDetailDto {
  return toAdminSubscriptionListItemDto(subscription);
}

export function toAdminSubscriptionHistoryItemDto(
  history: SubscriptionHistoryEntity,
): AdminSubscriptionHistoryItemDto {
  return {
    id: history.id,
    subscriptionId: history.subscriptionId,
    tenantId: history.tenantId,
    event: history.event,
    fromPlanId: history.fromPlanId,
    toPlanId: history.toPlanId,
    performedBy: history.performedBy,
    createdAt: history.createdAt,
  };
}
