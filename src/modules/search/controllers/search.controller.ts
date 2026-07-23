import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchTenantsQueryDto } from '../dto/search-tenants-query.dto';
import { TenantSearchResponseDto } from '../dto/tenant-search-result.dto';
import { SearchTenantsUseCase } from '../use-cases/search-tenants.use-case';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchTenantsUseCase: SearchTenantsUseCase) {}

  @Get('tenants')
  @ApiOperation({
    summary: 'Busca pública de estabelecimentos',
    description:
      'Lista estabelecimentos elegíveis por nome, slug, segmento, localização e/ou destaque regional (`regionalHighlight`). Rota pública, sem autenticação. Com `regionalHighlight`, ordena por nota média primeiro (tela de destaques).',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados da busca paginados',
    type: TenantSearchResponseDto,
  })
  async searchTenants(@Query() query: SearchTenantsQueryDto) {
    return this.searchTenantsUseCase.run(query);
  }
}
