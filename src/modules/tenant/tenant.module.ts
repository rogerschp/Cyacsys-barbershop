import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { TenantRepository } from '../../repository/tenant/tenant.repository';
import { AuthModule } from '../auth/auth.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { TenantController } from './tenant.controller';
import { TenantEntity } from './entities/tenant.entity';
import { TenantService } from './tenant.service';
import { CreateTenantWithOwnerUseCase } from './use-cases/create-tenant-with-owner.use-case';
@Module({
    imports: [
        TypeOrmModule.forFeature([TenantEntity]),
        AuthModule,
        forwardRef(() => TenantUserModule),
    ],
    controllers: [TenantController],
    providers: [
        TenantRepository,
        TenantService,
        CreateTenantWithOwnerUseCase,
        TenantInterceptor,
    ],
    exports: [TenantService, TenantInterceptor],
})
export class TenantModule {
}
