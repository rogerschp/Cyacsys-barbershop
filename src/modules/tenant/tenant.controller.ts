import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ValidateSlugDto } from './dto/validate-slug.dto';
import { TenantEntity } from './entities/tenant.entity';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('validate-slug')
  @ApiOperation({ summary: 'Valida disponibilidade de slug' })
  @ApiQuery({ name: 'slug', required: true, description: 'Slug a validar' })
  @ApiResponse({
    status: 200,
    description: 'Resultado da validação (available: boolean)',
  })
  validateSlug(@Query() query: ValidateSlugDto) {
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
  findOne(@Param('id') id: string) {
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
  findBySlug(@Param('slug') slug: string) {
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
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza tenant' })
  @ApiParam({ name: 'id', description: 'UUID do tenant' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({
    status: 200,
    description: 'Tenant atualizado',
    type: TenantEntity,
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove tenant (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID do tenant' })
  @ApiResponse({ status: 200, description: 'Tenant removido' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
}
