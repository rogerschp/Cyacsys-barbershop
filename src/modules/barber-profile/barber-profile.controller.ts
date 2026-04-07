import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards, UseInterceptors, } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, } from '@nestjs/swagger';
import { TenantRoles } from '../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../common/guards/tenant-roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { TenantUserRole } from '../tenant-user/entities/tenant-user-role.enum';
import { CreateBarberProfileDto } from './dto/create-barber-profile.dto';
import { BarberProfileResponseDto } from './dto/barber-profile-response.dto';
import { UpdateBarberProfileDto } from './dto/update-barber-profile.dto';
import { CreateBarberProfileUseCase } from './use-cases/create-barber-profile.use-case';
import { DeactivateBarberProfileUseCase } from './use-cases/deactivate-barber-profile.use-case';
import { GetBarberProfileUseCase } from './use-cases/get-barber-profile.use-case';
import { ListBarberProfilesUseCase } from './use-cases/list-barber-profiles.use-case';
import { UpdateBarberProfileUseCase } from './use-cases/update-barber-profile.use-case';
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
@ApiTags('barber-profiles')
@Controller('tenants/:tenantId/barber-profiles')
@UseGuards(BearerAuthGuard)
@UseInterceptors(TenantInterceptor)
@UseGuards(TenantMembershipGuard, TenantRolesGuard)
@ApiBearerAuth('bearer')
export class BarberProfileController {
    constructor(private readonly createBarberProfileUseCase: CreateBarberProfileUseCase, private readonly updateBarberProfileUseCase: UpdateBarberProfileUseCase, private readonly deactivateBarberProfileUseCase: DeactivateBarberProfileUseCase, private readonly listBarberProfilesUseCase: ListBarberProfilesUseCase, private readonly getBarberProfileUseCase: GetBarberProfileUseCase) { }
    @Post()
    @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF)
    @ApiOperation({
        summary: 'Cria um perfil de barbeiro',
        description: 'Apenas OWNER, ADMIN ou STAFF. tenantUserId deve existir no tenant e ter role BARBER. Um tenantUserId só pode ter um perfil por tenant.',
    })
    @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
    @ApiBody({ type: CreateBarberProfileDto })
    @ApiResponse({
        status: 201,
        description: 'Perfil de barbeiro criado',
        type: BarberProfileResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Regra de negócio (INVALID_BARBER_ROLE, BARBER_PROFILE_ALREADY_EXISTS, INVALID_EXPERIENCE_YEARS)',
    })
    @ApiResponse({ status: 404, description: 'TENANT_USER_NOT_FOUND' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    @ApiResponse({
        status: 403,
        description: 'Usuário não é OWNER, ADMIN ou STAFF do tenant',
    })
    async create(
    @Param('tenantId')
    tenantId: string, 
    @Body()
    dto: CreateBarberProfileDto, 
    @Req()
    req: RequestWithUserAndMembership) {
        const createdBy = req.user?.dbUser?.id ?? '';
        return this.createBarberProfileUseCase.run(tenantId, dto, createdBy);
    }
    @Get()
    @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF, TenantUserRole.BARBER)
    @ApiOperation({
        summary: 'Lista perfis de barbeiros do tenant',
        description: 'Retorna apenas perfis não deletados (soft delete).',
    })
    @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
    @ApiResponse({
        status: 200,
        description: 'Lista de perfis de barbeiros',
        type: [BarberProfileResponseDto],
    })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    @ApiResponse({
        status: 403,
        description: 'Usuário não é membro ativo do tenant',
    })
    async list(
    @Param('tenantId')
    tenantId: string) {
        return this.listBarberProfilesUseCase.run(tenantId);
    }
    @Get(':id')
    @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF, TenantUserRole.BARBER)
    @ApiOperation({ summary: 'Busca um perfil de barbeiro por ID' })
    @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
    @ApiParam({ name: 'id', description: 'UUID do perfil de barbeiro' })
    @ApiResponse({
        status: 200,
        description: 'Perfil encontrado',
        type: BarberProfileResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Barber profile not found' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    @ApiResponse({
        status: 403,
        description: 'Usuário não é membro ativo do tenant',
    })
    async getOne(
    @Param('tenantId')
    tenantId: string, 
    @Param('id')
    id: string) {
        return this.getBarberProfileUseCase.run(tenantId, id);
    }
    @Patch(':id')
    @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF, TenantUserRole.BARBER)
    @ApiOperation({
        summary: 'Atualiza um perfil de barbeiro',
        description: 'OWNER, ADMIN ou STAFF podem alterar qualquer campo. BARBER só pode alterar o próprio perfil (avatar e bio). Para desativar use PATCH :id/deactivate.',
    })
    @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
    @ApiParam({ name: 'id', description: 'UUID do perfil de barbeiro' })
    @ApiBody({ type: UpdateBarberProfileDto })
    @ApiResponse({
        status: 200,
        description: 'Perfil atualizado',
        type: BarberProfileResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Regra de negócio (INVALID_EXPERIENCE_YEARS)',
    })
    @ApiResponse({ status: 404, description: 'Barber profile not found' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    @ApiResponse({
        status: 403,
        description: 'Usuário não autorizado ou BARBER tentando alterar perfil de outro barbeiro',
    })
    async update(
    @Param('tenantId')
    tenantId: string, 
    @Param('id')
    id: string, 
    @Body()
    dto: UpdateBarberProfileDto, 
    @Req()
    req: RequestWithUserAndMembership) {
        const performedBy = req.user?.dbUser?.id ?? '';
        const callerRole = req.tenantMembership?.role;
        return this.updateBarberProfileUseCase.run(tenantId, id, dto, performedBy, callerRole);
    }
    @Patch(':id/deactivate')
    @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF)
    @ApiOperation({
        summary: 'Desativa um perfil de barbeiro',
        description: 'Define isActive = false. Barbeiro inativo não pode receber agendamentos (validação no módulo Booking).',
    })
    @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
    @ApiParam({ name: 'id', description: 'UUID do perfil de barbeiro' })
    @ApiResponse({
        status: 200,
        description: 'Perfil desativado',
        type: BarberProfileResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Barber profile not found' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    @ApiResponse({
        status: 403,
        description: 'Usuário não é OWNER, ADMIN ou STAFF',
    })
    async deactivate(
    @Param('tenantId')
    tenantId: string, 
    @Param('id')
    id: string, 
    @Req()
    req: RequestWithUserAndMembership) {
        const performedBy = req.user?.dbUser?.id ?? '';
        return this.deactivateBarberProfileUseCase.run(tenantId, id, performedBy);
    }
}
