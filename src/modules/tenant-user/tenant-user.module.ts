import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantUserRepository } from '../../repository/tenant-user/tenant-user.repository';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { UserModule } from '../user/user.module';
import { TenantUserEntity } from './entities/tenant-user.entity';
import { TenantMembershipGuard } from './guards/tenant-membership.guard';
import { TenantRolesGuard } from './guards/tenant-roles.guard';
import { TENANT_USER_REPOSITORY } from './interfaces/tenant-user-repository.interface';
import { TenantUserController } from './tenant-user.controller';
import { TenantUserService } from './tenant-user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantUserEntity]),
    AuthModule,
    forwardRef(() => TenantModule),
    UserModule,
  ],
  controllers: [TenantUserController],
  providers: [
    TenantUserRepository,
    { provide: TENANT_USER_REPOSITORY, useClass: TenantUserRepository },
    TenantUserService,
    TenantMembershipGuard,
    TenantRolesGuard,
  ],
  exports: [
    TenantUserService,
    TenantMembershipGuard,
    TenantRolesGuard,
    TypeOrmModule,
  ],
})
export class TenantUserModule {}
