import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
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
import { TenantRoles } from '../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../common/guards/tenant-roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { TenantUserRole } from '../tenant-user/entities/tenant-user-role.enum';
import { CreateServiceUseCase } from './use-cases/create-service.use-case';
import { DeactivateServiceUseCase } from './use-cases/deactivate-service.use-case';
import { GetServiceUseCase } from './use-cases/get-service.use-case';
import { ListServicesByTenantUseCase } from './use-cases/list-services.use-case';
import { UpdateServiceUseCase } from './use-cases/update-service.use-case';

interface RequestWithUser {
  user?: { dbUser?: { id: string } };
}

@ApiTags('services')
@Controller('tenants/:tenantId/services')
@UseGuards(BearerAuthGuard)
@UseInterceptors(TenantInterceptor)
@UseGuards(TenantMembershipGuard, TenantRolesGuard)
@ApiBearerAuth('bearer')
export class ServiceController {
  constructor(
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly updateServiceUseCase: UpdateServiceUseCase,
    private readonly deactivateServiceUseCase: DeactivateServiceUseCase,
    private readonly listServicesByTenantUseCase: ListServicesByTenantUseCase,
    private readonly getServiceUseCase: GetServiceUseCase,
  ) {}

  @Post()
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiOperation({
    summary: 'Cria um serviço no tenant',
    description:
      'Apenas OWNER ou ADMIN. Nome único por tenant. Preço >= 0, duração >= 5 min.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({
    status: 201,
    description: 'Serviço criado',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Regra de negócio violada (nome duplicado, preço/duração inválido)',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é OWNER ou ADMIN do tenant',
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateServiceDto,
    @Req() req: RequestWithUser,
  ) {
    const createdBy = req.user?.dbUser?.id ?? '';
    return this.createServiceUseCase.run(tenantId, dto, createdBy);
  }

  @Get()
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF)
  @ApiOperation({
    summary: 'Lista serviços do tenant',
    description: 'Retorna serviços ativos e inativos (exclui soft-deleted).',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({
    status: 200,
    description: 'Lista de serviços',
    type: [ServiceResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro ativo do tenant',
  })
  async list(@Param('tenantId') tenantId: string) {
    return this.listServicesByTenantUseCase.run(tenantId);
  }

  @Get(':id')
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF)
  @ApiOperation({
    summary: 'Busca um serviço por ID',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiParam({ name: 'id', description: 'UUID do serviço' })
  @ApiResponse({
    status: 200,
    description: 'Serviço encontrado',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é membro ativo do tenant',
  })
  async getOne(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.getServiceUseCase.run(tenantId, id);
  }

  @Patch(':id')
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiOperation({
    summary: 'Atualiza um serviço',
    description:
      'Não permite alterar tenantId. Valida nome único e preço/duração.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiParam({ name: 'id', description: 'UUID do serviço' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({
    status: 200,
    description: 'Serviço atualizado',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Regra de negócio violada',
  })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é OWNER ou ADMIN',
  })
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.updateServiceUseCase.run(tenantId, id, dto);
  }

  @Patch(':id/deactivate')
  @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
  @ApiOperation({
    summary: 'Desativa um serviço',
    description:
      'Define isActive = false. Serviço inativo não pode ser usado em booking.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiParam({ name: 'id', description: 'UUID do serviço' })
  @ApiResponse({
    status: 200,
    description: 'Serviço desativado',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é OWNER ou ADMIN',
  })
  async deactivate(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const performedBy = req.user?.dbUser?.id ?? '';
    return this.deactivateServiceUseCase.run(tenantId, id, performedBy);
  }
}
