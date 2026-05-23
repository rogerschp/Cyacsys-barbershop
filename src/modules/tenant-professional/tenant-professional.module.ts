import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantProfessionalRepository } from '../../repository/tenant-professional/tenant-professional.repository';
import { AuthModule } from '../auth/auth.module';
import { ProfessionalProfileModule } from '../professional-profile/professional-profile.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { TenantProfessionalEntity } from './entities/tenant-professional.entity';
import { TENANT_PROFESSIONAL_REPOSITORY } from './interfaces/tenant-professional-repository.interface';
import { TenantProfessionalController } from './tenant-professional.controller';
import { GetTenantProfessionalUseCase } from './use-cases/get-tenant-professional.use-case';
import { LeaveTenantProfessionalUseCase } from './use-cases/leave-tenant-professional.use-case';
import { LinkMyProfessionalToTenantUseCase } from './use-cases/link-my-professional-to-tenant.use-case';
import { LinkProfessionalToTenantUseCase } from './use-cases/link-professional-to-tenant.use-case';
import { ListTenantProfessionalsUseCase } from './use-cases/list-tenant-professionals.use-case';
import { UpdateTenantProfessionalStatusUseCase } from './use-cases/update-tenant-professional-status.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantProfessionalEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => TenantModule),
    forwardRef(() => TenantUserModule),
    forwardRef(() => ProfessionalProfileModule),
  ],
  controllers: [TenantProfessionalController],
  providers: [
    TenantProfessionalRepository,
    {
      provide: TENANT_PROFESSIONAL_REPOSITORY,
      useClass: TenantProfessionalRepository,
    },
    LinkProfessionalToTenantUseCase,
    LinkMyProfessionalToTenantUseCase,
    ListTenantProfessionalsUseCase,
    GetTenantProfessionalUseCase,
    UpdateTenantProfessionalStatusUseCase,
    LeaveTenantProfessionalUseCase,
  ],
  exports: [
    TENANT_PROFESSIONAL_REPOSITORY,
    GetTenantProfessionalUseCase,
    ListTenantProfessionalsUseCase,
  ],
})
export class TenantProfessionalModule {}
