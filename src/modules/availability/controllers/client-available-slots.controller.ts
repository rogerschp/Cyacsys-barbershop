import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantResolverGuard } from '../../../common/guards/tenant-resolver.guard';
import { AvailableSlotsResponseDto } from '../dto/available-slots-response.dto';
import { GetAvailableSlotsQueryDto } from '../dto/get-available-slots-query.dto';
import { GetClientAvailableSlotsUseCase } from '../use-cases/get-client-available-slots.use-case';

@ApiTags('client-booking')
@Controller(
  'tenants/:tenantId/tenant-professionals/:tenantProfessionalId/available-slots/public',
)
@UseGuards(TenantResolverGuard)
export class ClientAvailableSlotsController {
  constructor(
    private readonly getClientAvailableSlotsUseCase: GetClientAvailableSlotsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Slots disponíveis (vitrine / guest / cliente)',
    description:
      'Sem Bearer. Exclui DRAFT/CONFIRMED e lead time. Usado por guest e cliente autenticado.',
  })
  @ApiParam({ name: 'tenantId' })
  @ApiParam({ name: 'tenantProfessionalId' })
  @ApiQuery({ name: 'serviceId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2026-07-20' })
  @ApiResponse({ status: 200, type: AvailableSlotsResponseDto })
  async get(
    @Param('tenantId') tenantId: string,
    @Param('tenantProfessionalId') tenantProfessionalId: string,
    @Query() query: GetAvailableSlotsQueryDto,
  ): Promise<AvailableSlotsResponseDto> {
    return this.getClientAvailableSlotsUseCase.run(
      tenantId,
      tenantProfessionalId,
      query.serviceId,
      query.date,
    );
  }
}
