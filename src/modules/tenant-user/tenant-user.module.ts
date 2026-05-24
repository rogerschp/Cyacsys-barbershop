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
import { AddUserToTenantUseCase } from './use-cases/add-user-to-tenant.use-case';
import { FindMembershipByTenantIdAndUserIdUseCase } from './use-cases/find-membership-by-tenantId-and-userId.use-case';
import { FindTenantUserByIdAndTenantUseCase } from './use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { FindUserRoleByUserIdAndTenantIdUseCase } from './use-cases/find-user-role-by-userId-and-tenantId.use-case';
import { RemoveUserFromTenantByUserIdAndTenantIdUseCase } from './use-cases/remove-user-from-tenant-by-userId-and-tenantId.use-case';
import { ValidateMembershipByUserIdAndTenantIdUseCase } from './use-cases/validate-membership-by-userId-and-tenantId.use-case';
import { FindOptionalMembershipByTenantAndUserUseCase } from './use-cases/find-optional-membership-by-tenant-and-user.use-case';
@Module({
  imports: [
    TypeOrmModule.forFeature([TenantUserEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => TenantModule),
    forwardRef(() => UserModule),
  ],
  controllers: [TenantUserController],
  providers: [
    TenantUserRepository,
    { provide: TENANT_USER_REPOSITORY, useClass: TenantUserRepository },
    AddUserToTenantUseCase,
    FindTenantUserByIdAndTenantUseCase,
    FindMembershipByTenantIdAndUserIdUseCase,
    FindUserRoleByUserIdAndTenantIdUseCase,
    ValidateMembershipByUserIdAndTenantIdUseCase,
    FindOptionalMembershipByTenantAndUserUseCase,
    RemoveUserFromTenantByUserIdAndTenantIdUseCase,
    TenantMembershipResolverAdapter,
    {
      provide: TENANT_MEMBERSHIP_RESOLVER,
      useClass: TenantMembershipResolverAdapter,
    },
    TenantMembershipGuard,
    TenantRolesGuard,
  ],
  exports: [
    AddUserToTenantUseCase,
    FindTenantUserByIdAndTenantUseCase,
    FindMembershipByTenantIdAndUserIdUseCase,
    FindUserRoleByUserIdAndTenantIdUseCase,
    ValidateMembershipByUserIdAndTenantIdUseCase,
    FindOptionalMembershipByTenantAndUserUseCase,
    RemoveUserFromTenantByUserIdAndTenantIdUseCase,
    TENANT_MEMBERSHIP_RESOLVER,
    TenantMembershipGuard,
    TenantRolesGuard,
    TypeOrmModule,
  ],
})
export class TenantUserModule {}
