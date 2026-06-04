import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { TenantRepository } from '../../repository/tenant/tenant.repository';
import { AuthModule } from '../auth/auth.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { TenantController } from './tenant.controller';
import { TenantEntity } from './entities/tenant.entity';
import { CreateTenantWithOwnerUseCase } from './use-cases/create-tenant-with-owner.use-case';
import { AddressModule } from '../address/address.module';
import { FindTenantByIdUseCase } from './use-cases/find-tenant-by-id.use-case';
import { FindTenantBySlugUseCase } from './use-cases/find-tenant-by-slug.use-case';
import { UpdateTenantByIdUseCase } from './use-cases/update-tenant-by-id.use-case';
import { ValidateSlugUseCase } from './use-cases/validate-slug.use-case';
import { DeleteTenantByIdUseCase } from './use-cases/delete-tenant-by-id.use-case';
import { CreateTenantUseCase } from './use-cases/create-tenant.use-case';
import { SubscriptionModule } from '../subscription/subscription.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([TenantEntity]),
    forwardRef(() => AuthModule),
    AddressModule,
    forwardRef(() => TenantUserModule),
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [TenantController],
  providers: [
    TenantRepository,
    FindTenantByIdUseCase,
    FindTenantBySlugUseCase,
    UpdateTenantByIdUseCase,
    ValidateSlugUseCase,
    DeleteTenantByIdUseCase,
    CreateTenantUseCase,
    CreateTenantWithOwnerUseCase,
    TenantInterceptor,
  ],
  exports: [
    FindTenantByIdUseCase,
    TenantInterceptor,
    CreateTenantWithOwnerUseCase,
    FindTenantBySlugUseCase,
    ValidateSlugUseCase,
    DeleteTenantByIdUseCase,
    UpdateTenantByIdUseCase,
    CreateTenantUseCase,
  ],
})
export class TenantModule {}
