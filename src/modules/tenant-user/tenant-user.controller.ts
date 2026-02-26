import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { AddMemberToTenantDto } from './dto/add-member-to-tenant.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { TenantMembershipGuard } from './guards/tenant-membership.guard';
import { TenantUserService } from './tenant-user.service';

@ApiTags('tenant-members')
@Controller('tenants/:tenantId/members')
@UseGuards(BearerAuthGuard)
@UseInterceptors(TenantInterceptor)
@UseGuards(TenantMembershipGuard)
@ApiBearerAuth('bearer')
export class TenantUserController {
  constructor(private readonly tenantUserService: TenantUserService) {}

  @Post()
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
    @Param('tenantId') tenantId: string,
    @Body() dto: AddMemberToTenantDto,
  ) {
    return this.tenantUserService.addUserToTenant(
      dto.userId,
      tenantId,
      dto.role,
    );
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
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.tenantUserService.getMembership(tenantId, userId);
  }

  @Delete(':userId')
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
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    await this.tenantUserService.removeUserFromTenant(userId, tenantId);
  }
}
