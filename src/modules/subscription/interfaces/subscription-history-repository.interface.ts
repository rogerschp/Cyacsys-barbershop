import { EntityManager } from 'typeorm';
import { SubscriptionHistoryEntity } from '../entities/subscription-history.entity';
import { SubscriptionEvent } from '../enums/subscription-event.enum';

export interface CreateSubscriptionHistoryData {
  tenantId: string;
  subscriptionId: string;
  event: SubscriptionEvent;
  fromPlanId?: string | null;
  toPlanId?: string | null;
  performedBy: string;
}

export interface ISubscriptionHistoryRepository {
  create(
    data: CreateSubscriptionHistoryData,
    manager?: EntityManager,
  ): Promise<SubscriptionHistoryEntity>;
  findByTenantId(tenantId: string): Promise<SubscriptionHistoryEntity[]>;
}

export const SUBSCRIPTION_HISTORY_REPOSITORY = Symbol(
  'SUBSCRIPTION_HISTORY_REPOSITORY',
);
