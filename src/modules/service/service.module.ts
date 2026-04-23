import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRepository } from '../../repository/service/service.repository';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { ServiceEntity } from './entities/service.entity';
import { SERVICE_REPOSITORY } from './interfaces/service-repository.interface';
import { ServiceController } from './service.controller';
import { CreateServiceUseCase } from './use-cases/create-service.use-case';
import { DeactivateServiceUseCase } from './use-cases/deactivate-service.use-case';
import { GetServiceUseCase } from './use-cases/get-service.use-case';
import { ListServicesByTenantUseCase } from './use-cases/list-services.use-case';
import { UpdateServiceUseCase } from './use-cases/update-service.use-case';
@Module({
    imports: [
        TypeOrmModule.forFeature([ServiceEntity]),
        AuthModule,
        TenantModule,
        TenantUserModule,
    ],
    controllers: [ServiceController],
    providers: [
        ServiceRepository,
        { provide: SERVICE_REPOSITORY, useClass: ServiceRepository },
        CreateServiceUseCase,
        UpdateServiceUseCase,
        DeactivateServiceUseCase,
        ListServicesByTenantUseCase,
        GetServiceUseCase,
    ],
    exports: [SERVICE_REPOSITORY],
})
export class ServiceModule {
}
