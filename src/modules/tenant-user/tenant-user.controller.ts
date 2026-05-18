import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  //UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantRoles } from '../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../common/guards/tenant-roles.guard';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { AddMemberToTenantDto } from './dto/add-member-to-tenant.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { TenantUserRole } from './entities/tenant-user-role.enum';
import { TenantResolverGuard } from '../../common/guards/tenant-resolver.guard';
import { AddUserToTenantUseCase } from './use-cases/add-user-to-tenant.use-case';
import { FindMembershipByTenantIdAndUserIdUseCase } from './use-cases/find-membership-by-tenantId-and-userId.use-case';
import { FindTenantUserByIdAndTenantUseCase } from './use-cases/find-tenant-user-by-id-and-tenant.use-case';
import { FindUserRoleByUserIdAndTenantIdUseCase } from './use-cases/find-user-role-by-userId-and-tenantId.use-case';
import { RemoveUserFromTenantByUserIdAndTenantIdUseCase } from './use-cases/remove-user-from-tenant-by-userId-and-tenantId.use-case';
import { ValidateMembershipByUserIdAndTenantIdUseCase } from './use-cases/validate-membership-by-userId-and-tenantId.use-case';
@ApiTags('tenant-members')
@Controller('tenants/:tenantId/members')
@UseGuards(
  BearerAuthGuard,
  TenantResolverGuard,
  TenantMembershipGuard,
  TenantRolesGuard,
)
//@UseInterceptors(TenantInterceptor)
@ApiBearerAuth('bearer')
export class TenantUserController {
  constructor(
    private readonly addUserToTenantUseCase: AddUserToTenantUseCase,
    private readonly findTenantUserByIdAndTenantUseCase: FindTenantUserByIdAndTenantUseCase,
    private readonly findMembershipByTenantIdAndUserIdUseCase: FindMembershipByTenantIdAndUserIdUseCase,
    private readonly findUserRoleByUserIdAndTenantIdUseCase: FindUserRoleByUserIdAndTenantIdUseCase,
    private readonly validateMembershipByUserIdAndTenantIdUseCase: ValidateMembershipByUserIdAndTenantIdUseCase,
    private readonly removeUserFromTenantByUserIdAndTenantIdUseCase: RemoveUserFromTenantByUserIdAndTenantIdUseCase,
  ) {}
  @Post()
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiOperation({
    summary: 'Vincula um usuário ao tenant',
    description:
      'Adiciona um usuário como membro do tenant com o papel indicado. Tenant e usuário devem existir; não permite vínculo duplicado.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiBody({ type: AddMemberToTenantDto })
  @ApiResponse({
    status: 201,
    description: 'Membro vinculado ao tenant',
    type: MemberResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant ou usuário não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Usuário já vinculado a este tenant',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro ativo do tenant',
  })
  async addMember(
    @Param('tenantId')
    tenantId: string,
    @Body()
    dto: AddMemberToTenantDto,
  ) {
    return this.addUserToTenantUseCase.run(dto.userId, tenantId, dto.role);
  }
  @Get(':userId')
  @ApiOperation({
    summary: 'Busca vínculo do usuário no tenant',
    description: 'Retorna o membership (role, status) do usuário neste tenant.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiParam({ name: 'userId', description: 'UUID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Vínculo encontrado',
    type: MemberResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Vínculo não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro ativo do tenant',
  })
  async getMember(
    @Param('tenantId')
    tenantId: string,
    @Param('userId')
    userId: string,
  ) {
    return this.findMembershipByTenantIdAndUserIdUseCase.run(tenantId, userId);
  }
  @Delete(':userId')
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiOperation({
    summary: 'Remove usuário do tenant',
    description: 'Desvincula o usuário do tenant (remove o registro na pivot).',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiParam({ name: 'userId', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Membro removido do tenant' })
  @ApiResponse({ status: 404, description: 'Vínculo não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro ativo do tenant',
  })
  async removeMember(
    @Param('tenantId')
    tenantId: string,
    @Param('userId')
    userId: string,
  ) {
    await this.removeUserFromTenantByUserIdAndTenantIdUseCase.run(
      userId,
      tenantId,
    );
  }
}
