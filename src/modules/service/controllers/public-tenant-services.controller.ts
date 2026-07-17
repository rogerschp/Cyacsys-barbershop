import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServiceResponseDto } from '../dto/service-response.dto';
import { ListPublicTenantServicesUseCase } from '../use-cases/list-public-tenant-services.use-case';

@ApiTags('public-catalog')
@Controller('tenants/:tenantId/public/services')
export class PublicTenantServicesController {
  constructor(
    private readonly listPublicTenantServicesUseCase: ListPublicTenantServicesUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista serviços ativos do estabelecimento (vitrine pública)',
    description: 'Sem autenticação. Apenas serviços isActive = true.',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({ status: 200, type: [ServiceResponseDto] })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  @ApiResponse({ status: 403, description: 'Tenant inativo' })
  async list(
    @Param('tenantId') tenantId: string,
  ): Promise<ServiceResponseDto[]> {
    return this.listPublicTenantServicesUseCase.run(tenantId);
  }
}
