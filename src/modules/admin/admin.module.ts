import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AdminSubscriptionController } from './controllers/admin-subscription.controller';
import { ActivateAdminSubscriptionUseCase } from './use-cases/activate-admin-subscription.use-case';
import { ExpireAdminSubscriptionUseCase } from './use-cases/expire-admin-subscription.use-case';
import { GetAdminSubscriptionHistoryUseCase } from './use-cases/get-admin-subscription-history.use-case';
import { GetAdminSubscriptionUseCase } from './use-cases/get-admin-subscription.use-case';
import { ListAdminSubscriptionsUseCase } from './use-cases/list-admin-subscriptions.use-case';

@Module({
  imports: [AuthModule, SubscriptionModule],
  controllers: [AdminSubscriptionController],
  providers: [
    ListAdminSubscriptionsUseCase,
    GetAdminSubscriptionUseCase,
    GetAdminSubscriptionHistoryUseCase,
    ActivateAdminSubscriptionUseCase,
    ExpireAdminSubscriptionUseCase,
  ],
})
export class AdminModule {}
