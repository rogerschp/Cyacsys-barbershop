import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors, } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, } from '@nestjs/swagger';
import { Request } from 'express';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { TenantRoles } from '../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../common/guards/tenant-roles.guard';
import { BearerAuthGuard } from '../auth/guards/bearer-auth.guard';
import { RequestUser } from '../auth/strategies/bearer-token.strategy';
import { TenantUserRole } from '../tenant-user/entities/tenant-user-role.enum';
import { CreateTenantWithOwnerUseCase } from './use-cases/create-tenant-with-owner.use-case';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ValidateSlugDto } from './dto/validate-slug.dto';
import { TenantEntity } from './entities/tenant.entity';
import { TenantService } from './tenant.service';
@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
    constructor(private readonly tenantService: TenantService, private readonly createTenantWithOwnerUseCase: CreateTenantWithOwnerUseCase) { }
    @Get('validate-slug')
    @ApiOperation({ summary: 'Valida disponibilidade de slug' })
    @ApiQuery({ name: 'slug', required: true, description: 'Slug a validar' })
    @ApiResponse({
        status: 200,
        description: 'Resultado da validação (available: boolean)',
    })
    validateSlug(
    @Query()
    query: ValidateSlugDto) {
        return this.tenantService.validateSlug(query);
    }
    @Get('by-id/:id')
    @ApiOperation({ summary: 'Busca tenant por ID' })
    @ApiParam({ name: 'id', description: 'UUID do tenant' })
    @ApiResponse({
        status: 200,
        description: 'Tenant encontrado',
        type: TenantEntity,
    })
    @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
    findOne(
    @Param('id')
    id: string) {
        return this.tenantService.findById(id);
    }
    @Get('by-slug/:slug')
    @ApiOperation({ summary: 'Busca tenant por slug' })
    @ApiParam({ name: 'slug', description: 'Slug do tenant' })
    @ApiResponse({
        status: 200,
        description: 'Tenant encontrado',
        type: TenantEntity,
    })
    @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
    findBySlug(
    @Param('slug')
    slug: string) {
        return this.tenantService.findBySlug(slug);
    }
    @Post()
    @ApiOperation({ summary: 'Cria um novo tenant' })
    @ApiBody({ type: CreateTenantDto })
    @ApiResponse({
        status: 201,
        description: 'Tenant criado',
        type: TenantEntity,
    })
    @ApiResponse({ status: 400, description: 'Dados inválidos ou slug inválido' })
    @ApiResponse({ status: 409, description: 'Slug já em uso' })
    create(
    @Body()
    dto: CreateTenantDto) {
        return this.tenantService.create(dto);
    }
    @Post('with-owner')
    @UseGuards(BearerAuthGuard)
    @ApiBearerAuth('bearer')
    @ApiOperation({
        summary: 'Cria tenant e vincula o usuário autenticado como OWNER',
        description: 'Requer autenticação. Cria o tenant e o vínculo em tenant_users (role=OWNER) em uma única transação. Não altera UserEntity.',
    })
    @ApiBody({ type: CreateTenantDto })
    @ApiResponse({
        status: 201,
        description: 'Tenant criado com o usuário como OWNER',
        type: TenantEntity,
    })
    @ApiResponse({ status: 400, description: 'Dados inválidos ou slug inválido' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    @ApiResponse({ status: 409, description: 'Slug já em uso' })
    async createWithOwner(
    @Req()
    req: Request & {
        user: RequestUser;
    }, 
    @Body()
    dto: CreateTenantDto) {
        return this.createTenantWithOwnerUseCase.run(req.user.dbUser.id, dto);
    }
    @Patch(':id')
    @UseGuards(BearerAuthGuard)
    @UseInterceptors(TenantInterceptor)
    @UseGuards(TenantMembershipGuard, TenantRolesGuard)
    @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
    @ApiBearerAuth('bearer')
    @ApiOperation({
        summary: 'Atualiza tenant',
        description: 'Requer ser membro ativo com papel OWNER ou ADMIN.',
    })
    @ApiParam({ name: 'id', description: 'UUID do tenant' })
    @ApiBody({ type: UpdateTenantDto })
    @ApiResponse({
        status: 200,
        description: 'Tenant atualizado',
        type: TenantEntity,
    })
    @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    @ApiResponse({
        status: 403,
        description: 'Usuário não é membro ativo do tenant',
    })
    update(
    @Param('id')
    id: string, 
    @Body()
    dto: UpdateTenantDto) {
        return this.tenantService.update(id, dto);
    }
    @Delete(':id')
    @UseGuards(BearerAuthGuard)
    @UseInterceptors(TenantInterceptor)
    @UseGuards(TenantMembershipGuard, TenantRolesGuard)
    @TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN)
    @ApiBearerAuth('bearer')
    @ApiOperation({
        summary: 'Remove tenant (soft delete)',
        description: 'Requer ser membro ativo com papel OWNER ou ADMIN.',
    })
    @ApiParam({ name: 'id', description: 'UUID do tenant' })
    @ApiResponse({ status: 200, description: 'Tenant removido' })
    @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
    @ApiResponse({ status: 401, description: 'Não autenticado' })
    @ApiResponse({
        status: 403,
        description: 'Usuário não é membro ativo do tenant',
    })
    remove(
    @Param('id')
    id: string) {
        return this.tenantService.remove(id);
    }
}
