import { EntityManager } from 'typeorm';
import { PaginatedOptionsDto } from '../../../common/dto/paginated-options.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { TenantSubscriptionEntity } from '../entities/tenant-subscription.entity';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export interface CreateTenantSubscriptionData {
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  gracePeriodEnd?: Date | null;
  activatedBy?: string | null;
}

export interface UpdateTenantSubscriptionData {
  planId?: string;
  status?: SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  gracePeriodEnd?: Date | null;
  cancelledAt?: Date | null;
  activatedBy?: string | null;
}

export interface ITenantSubscriptionRepository {
  create(
    data: CreateTenantSubscriptionData,
    manager?: EntityManager,
  ): Promise<TenantSubscriptionEntity>;
  findByTenantId(tenantId: string): Promise<TenantSubscriptionEntity | null>;
  findByTenantIdWithPlan(
    tenantId: string,
  ): Promise<TenantSubscriptionEntity | null>;
  findPaginatedWithPlanAndTenant(
    options: PaginatedOptionsDto,
  ): Promise<PaginatedResponseDto<TenantSubscriptionEntity>>;
  update(
    id: string,
    data: UpdateTenantSubscriptionData,
    manager?: EntityManager,
  ): Promise<TenantSubscriptionEntity>;
  findExpiredActive(now: Date): Promise<TenantSubscriptionEntity[]>;
  findExpiredGracePeriod(now: Date): Promise<TenantSubscriptionEntity[]>;
}

export const TENANT_SUBSCRIPTION_REPOSITORY = Symbol(
  'TENANT_SUBSCRIPTION_REPOSITORY',
);
