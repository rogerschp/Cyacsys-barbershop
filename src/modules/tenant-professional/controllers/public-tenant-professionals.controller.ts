import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicTenantProfessionalResponseDto } from '../dto/public-tenant-professional-response.dto';
import { ListPublicTenantProfessionalsUseCase } from '../use-cases/list-public-tenant-professionals.use-case';

@ApiTags('public-catalog')
@Controller('tenants/:tenantId/public/professionals')
export class PublicTenantProfessionalsController {
  constructor(
    private readonly listPublicTenantProfessionalsUseCase: ListPublicTenantProfessionalsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista profissionais ativos do estabelecimento (vitrine pública)',
    description:
      'Sem autenticação. Retorna apenas vínculos ACTIVE com perfil global ativo. Use o `id` (tenantProfessionalId) na agenda/booking.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({ status: 200, type: [PublicTenantProfessionalResponseDto] })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  @ApiResponse({ status: 403, description: 'Tenant inativo' })
  async list(
    @Param('tenantId') tenantId: string,
  ): Promise<PublicTenantProfessionalResponseDto[]> {
    return this.listPublicTenantProfessionalsUseCase.run(tenantId);
  }
}
