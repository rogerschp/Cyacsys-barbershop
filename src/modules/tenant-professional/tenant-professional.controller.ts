import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantRoles } from '../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../common/guards/tenant-roles.guard';
import { TenantResolverGuard } from '../../common/guards/tenant-resolver.guard';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { TenantUserRole } from '../tenant-user/entities/tenant-user-role.enum';
import { LinkProfessionalToTenantDto } from './dto/link-professional-to-tenant.dto';
import { TenantProfessionalResponseDto } from './dto/tenant-professional-response.dto';
import { UpdateTenantProfessionalStatusDto } from './dto/update-tenant-professional-status.dto';
import { GetTenantProfessionalUseCase } from './use-cases/get-tenant-professional.use-case';
import { LeaveTenantProfessionalUseCase } from './use-cases/leave-tenant-professional.use-case';
import { LinkMyProfessionalToTenantUseCase } from './use-cases/link-my-professional-to-tenant.use-case';
import { LinkProfessionalToTenantUseCase } from './use-cases/link-professional-to-tenant.use-case';
import { ListTenantProfessionalsUseCase } from './use-cases/list-tenant-professionals.use-case';
import { UpdateTenantProfessionalStatusUseCase } from './use-cases/update-tenant-professional-status.use-case';
import { TenantProfessionalMapper } from './mappers/tenant-professional.mapper';

interface RequestWithUserAndMembership {
  user?: {
    dbUser?: {
      id: string;
    };
  };
  tenantMembership?: {
    role: string;
  };
}

@ApiTags('tenant-professionals')
@Controller('tenants/:tenantId/tenant-professionals')
@UseGuards(
  BearerAuthGuard,
  TenantResolverGuard,
  TenantMembershipGuard,
  TenantRolesGuard,
)
@ApiBearerAuth('bearer')
export class TenantProfessionalController {
  constructor(
    private readonly linkProfessionalToTenantUseCase: LinkProfessionalToTenantUseCase,
    private readonly linkMyProfessionalToTenantUseCase: LinkMyProfessionalToTenantUseCase,
    private readonly listTenantProfessionalsUseCase: ListTenantProfessionalsUseCase,
    private readonly getTenantProfessionalUseCase: GetTenantProfessionalUseCase,
    private readonly updateTenantProfessionalStatusUseCase: UpdateTenantProfessionalStatusUseCase,
    private readonly leaveTenantProfessionalUseCase: LeaveTenantProfessionalUseCase,
  ) {}

  @Post('me')
  @TenantRoles(
    TenantUserRole.OWNER,
    TenantUserRole.ADMIN,
    TenantUserRole.BARBER,
  )
  @ApiOperation({
    summary: 'Vincula o perfil profissional do usuário autenticado ao tenant',
    description:
      'Requer perfil global já criado e membership BARBER ou OWNER no tenant.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({
    status: 201,
    description: 'Vínculo criado',
    type: TenantProfessionalResponseDto,
  })
  async linkMine(
    @Param('tenantId') tenantId: string,
    @Req() req: RequestWithUserAndMembership,
  ) {
    const userId = req.user?.dbUser?.id ?? '';
    const entity = await this.linkMyProfessionalToTenantUseCase.run(
      tenantId,
      userId,
    );
    return TenantProfessionalMapper.toResponse(entity);
  }

  @Post()
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF)
  @ApiOperation({
    summary: 'Vincula um perfil profissional global ao tenant',
    description:
      'OWNER, ADMIN ou STAFF. O perfil deve existir e estar ativo globalmente.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiBody({ type: LinkProfessionalToTenantDto })
  @ApiResponse({
    status: 201,
    description: 'Vínculo criado ou reativado',
    type: TenantProfessionalResponseDto,
  })
  async link(
    @Param('tenantId') tenantId: string,
    @Body() dto: LinkProfessionalToTenantDto,
    @Req() req: RequestWithUserAndMembership,
  ) {
    const performedBy = req.user?.dbUser?.id ?? '';
    const entity = await this.linkProfessionalToTenantUseCase.run(
      tenantId,
      dto,
      performedBy,
    );
    return TenantProfessionalMapper.toResponse(entity);
  }

  @Get()
  @TenantRoles(
    TenantUserRole.OWNER,
    TenantUserRole.ADMIN,
    TenantUserRole.STAFF,
    TenantUserRole.BARBER,
  )
  @ApiOperation({
    summary: 'Lista profissionais vinculados ao tenant',
    description:
      'Substitui GET /barber-profiles. Cada item inclui o professionalProfile global aninhado.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    description:
      'Se true, retorna apenas vínculos ACTIVE com perfil global ativo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de vínculos',
    type: [TenantProfessionalResponseDto],
  })
  async list(
    @Param('tenantId') tenantId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const entities = await this.listTenantProfessionalsUseCase.run(tenantId, {
      activeOnly: activeOnly === 'true',
    });
    return TenantProfessionalMapper.toResponseList(entities);
  }

  @Get(':id')
  @TenantRoles(
    TenantUserRole.OWNER,
    TenantUserRole.ADMIN,
    TenantUserRole.STAFF,
    TenantUserRole.BARBER,
  )
  @ApiOperation({ summary: 'Busca vínculo profissional por ID' })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiParam({ name: 'id', description: 'UUID do tenant_professional' })
  @ApiResponse({
    status: 200,
    type: TenantProfessionalResponseDto,
  })
  async getOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    const entity = await this.getTenantProfessionalUseCase.run(tenantId, id);
    return TenantProfessionalMapper.toResponse(entity);
  }

  @Patch(':id/status')
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiOperation({ summary: 'Atualiza status do vínculo profissional no tenant' })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiParam({ name: 'id', description: 'UUID do tenant_professional' })
  @ApiBody({ type: UpdateTenantProfessionalStatusDto })
  @ApiResponse({
    status: 200,
    type: TenantProfessionalResponseDto,
  })
  async updateStatus(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTenantProfessionalStatusDto,
    @Req() req: RequestWithUserAndMembership,
  ) {
    const performedBy = req.user?.dbUser?.id ?? '';
    const entity = await this.updateTenantProfessionalStatusUseCase.run(
      tenantId,
      id,
      dto,
      performedBy,
    );
    return TenantProfessionalMapper.toResponse(entity);
  }

  @Patch(':id/leave')
  @TenantRoles(
    TenantUserRole.OWNER,
    TenantUserRole.ADMIN,
    TenantUserRole.BARBER,
  )
  @ApiOperation({
    summary: 'Encerra vínculo profissional no tenant',
    description:
      'Define status LEFT e leftAt. ADMIN/OWNER podem encerrar qualquer vínculo; BARBER apenas o próprio.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiParam({ name: 'id', description: 'UUID do tenant_professional' })
  @ApiResponse({
    status: 200,
    type: TenantProfessionalResponseDto,
  })
  async leave(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Req() req: RequestWithUserAndMembership,
  ) {
    const performedBy = req.user?.dbUser?.id ?? '';
    const callerRole = req.tenantMembership?.role;
    const entity = await this.leaveTenantProfessionalUseCase.run(
      tenantId,
      id,
      performedBy,
      callerRole,
    );
    return TenantProfessionalMapper.toResponse(entity);
  }
}
