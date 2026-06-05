import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../../common/guards/tenant-roles.guard';
import { TenantResolverGuard } from '../../../common/guards/tenant-resolver.guard';
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { TenantThemeResponseDto } from '../dto/tenant-theme-response.dto';
import { UpsertTenantThemeDto } from '../dto/upsert-tenant-theme.dto';
import { DeleteTenantThemeUseCase } from '../use-cases/delete-tenant-theme.use-case';
import { GetTenantThemeUseCase } from '../use-cases/get-tenant-theme.use-case';
import { UpsertTenantThemeUseCase } from '../use-cases/upsert-tenant-theme.use-case';

interface RequestWithUser {
  user?: { dbUser?: { id: string } };
}

@ApiTags('tenant-theme')
@Controller('tenants/:tenantId/theme')
export class TenantThemeController {
  constructor(
    private readonly getTenantThemeUseCase: GetTenantThemeUseCase,
    private readonly upsertTenantThemeUseCase: UpsertTenantThemeUseCase,
    private readonly deleteTenantThemeUseCase: DeleteTenantThemeUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtém tema público do estabelecimento',
    description:
      'Endpoint público. Retorna theme (ou null) e plano atual para o frontend.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({ status: 200, type: TenantThemeResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async get(@Param('tenantId') tenantId: string): Promise<TenantThemeResponseDto> {
    return this.getTenantThemeUseCase.run(tenantId);
  }

  @Put()
  @UseGuards(
    BearerAuthGuard,
    TenantResolverGuard,
    TenantMembershipGuard,
    TenantRolesGuard,
  )
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Cria ou substitui o tema do estabelecimento' })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiBody({ type: UpsertTenantThemeDto })
  @ApiResponse({ status: 200, type: TenantThemeResponseDto })
  @ApiResponse({ status: 403, description: 'Plano sem customização' })
  async upsert(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpsertTenantThemeDto,
    @Req() req: RequestWithUser,
  ): Promise<TenantThemeResponseDto> {
    const performedBy = req.user?.dbUser?.id ?? '';
    const theme = await this.upsertTenantThemeUseCase.run(
      tenantId,
      dto,
      performedBy,
    );
    const response = await this.getTenantThemeUseCase.run(tenantId);
    return { ...response, theme };
  }

  @Delete()
  @UseGuards(
    BearerAuthGuard,
    TenantResolverGuard,
    TenantMembershipGuard,
    TenantRolesGuard,
  )
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Remove customização e restaura defaults do frontend' })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({ status: 200, description: 'Tema removido' })
  async delete(
    @Param('tenantId') tenantId: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    const performedBy = req.user?.dbUser?.id ?? '';
    await this.deleteTenantThemeUseCase.run(tenantId, performedBy);
    return { message: 'Theme deleted successfully' };
  }
}
