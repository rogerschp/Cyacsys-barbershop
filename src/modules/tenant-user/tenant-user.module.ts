import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantUserRepository } from '../../repository/tenant-user/tenant-user.repository';
import { TENANT_MEMBERSHIP_RESOLVER } from '../../common/interfaces/tenant-membership-resolver.interface';
import { TenantMembershipGuard } from '../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../common/guards/tenant-roles.guard';
import { AuthModule } from '../auth/auth.module';
import { TenantModule } from '../tenant/tenant.module';
import { UserModule } from '../user/user.module';
import { TenantMembershipResolverAdapter } from './adapters/tenant-membership-resolver.adapter';
import { TenantUserEntity } from './entities/tenant-user.entity';
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
    TenantMembershipResolverAdapter,
    {
      provide: TENANT_MEMBERSHIP_RESOLVER,
      useClass: TenantMembershipResolverAdapter,
    },
    TenantMembershipGuard,
    TenantRolesGuard,
  ],
  exports: [
    TenantUserService,
    TENANT_MEMBERSHIP_RESOLVER,
    TenantMembershipGuard,
    TenantRolesGuard,
    TypeOrmModule,
  ],
})
export class TenantUserModule {}
