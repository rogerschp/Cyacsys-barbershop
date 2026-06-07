import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanRepository } from '../../repository/subscription/plan.repository';
import { SubscriptionHistoryRepository } from '../../repository/subscription/subscription-history.repository';
import { TenantSubscriptionRepository } from '../../repository/subscription/tenant-subscription.repository';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { AdminSubscriptionController } from './controllers/admin-subscription.controller';
import { PlanController } from './controllers/plan.controller';
import { TenantSubscriptionController } from './controllers/tenant-subscription.controller';
import { PlanEntity } from './entities/plan.entity';
import { SubscriptionHistoryEntity } from './entities/subscription-history.entity';
import { TenantSubscriptionEntity } from './entities/tenant-subscription.entity';
import { SubscriptionGuard } from './guards/subscription.guard';
import { PLAN_REPOSITORY } from './interfaces/plan-repository.interface';
import { SUBSCRIPTION_HISTORY_REPOSITORY } from './interfaces/subscription-history-repository.interface';
import { TENANT_SUBSCRIPTION_REPOSITORY } from './interfaces/tenant-subscription-repository.interface';
import { ExpireSubscriptionsJob } from './jobs/expire-subscriptions.job';
import { ActivateSubscriptionUseCase } from './use-cases/activate-subscription.use-case';
import { CancelSubscriptionUseCase } from './use-cases/cancel-subscription.use-case';
import { ChangePlanUseCase } from './use-cases/change-plan.use-case';
import { CreateFreeSubscriptionUseCase } from './use-cases/create-free-subscription.use-case';
import { ExpireSubscriptionsUseCase } from './use-cases/expire-subscriptions.use-case';
import { GetPlansUseCase } from './use-cases/get-plans.use-case';
import { GetSubscriptionHistoryUseCase } from './use-cases/get-subscription-history.use-case';
import { GetTenantSubscriptionUseCase } from './use-cases/get-tenant-subscription.use-case';
import { AssertTenantPlanFeatureUseCase } from './use-cases/assert-tenant-plan-feature.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanEntity,
      TenantSubscriptionEntity,
      SubscriptionHistoryEntity,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => TenantModule),
    forwardRef(() => TenantUserModule),
  ],
  controllers: [
    PlanController,
    TenantSubscriptionController,
    AdminSubscriptionController,
  ],
  providers: [
    { provide: PLAN_REPOSITORY, useClass: PlanRepository },
    {
      provide: TENANT_SUBSCRIPTION_REPOSITORY,
      useClass: TenantSubscriptionRepository,
    },
    {
      provide: SUBSCRIPTION_HISTORY_REPOSITORY,
      useClass: SubscriptionHistoryRepository,
    },
    GetPlansUseCase,
    GetTenantSubscriptionUseCase,
    GetSubscriptionHistoryUseCase,
    CreateFreeSubscriptionUseCase,
    ActivateSubscriptionUseCase,
    ChangePlanUseCase,
    CancelSubscriptionUseCase,
    ExpireSubscriptionsUseCase,
    ExpireSubscriptionsJob,
    SubscriptionGuard,
    AssertTenantPlanFeatureUseCase,
  ],
  exports: [
    PLAN_REPOSITORY,
    TENANT_SUBSCRIPTION_REPOSITORY,
    SUBSCRIPTION_HISTORY_REPOSITORY,
    CreateFreeSubscriptionUseCase,
    SubscriptionGuard,
    AssertTenantPlanFeatureUseCase,
    ChangePlanUseCase,
    CancelSubscriptionUseCase,
  ],
})
export class SubscriptionModule {}
