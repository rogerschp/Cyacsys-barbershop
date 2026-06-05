import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { TenantThemeController } from './controllers/tenant-theme.controller';
import { DeleteTenantThemeUseCase } from './use-cases/delete-tenant-theme.use-case';
import { GetTenantThemeUseCase } from './use-cases/get-tenant-theme.use-case';
import { UpsertTenantThemeUseCase } from './use-cases/upsert-tenant-theme.use-case';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => TenantModule),
    forwardRef(() => TenantUserModule),
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [TenantThemeController],
  providers: [
    GetTenantThemeUseCase,
    UpsertTenantThemeUseCase,
    DeleteTenantThemeUseCase,
  ],
})
export class TenantThemeModule {}
