import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TenantRoles } from '../../../common/decorators/tenant-roles.decorator';
import { TenantMembershipGuard } from '../../../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../../../common/guards/tenant-roles.guard';
import { TenantResolverGuard } from '../../../common/guards/tenant-resolver.guard';
import { BearerAuthGuard } from '../../auth/guards/bearer-auth.guard';
import { RequiresPlan } from '../../subscription/decorators/requires-plan.decorator';
import { PlanFeature } from '../../subscription/enums/plan-feature.enum';
import { SubscriptionGuard } from '../../subscription/guards/subscription.guard';
import { TenantUserRole } from '../../tenant-user/entities/tenant-user-role.enum';
import { EliteReportDto } from '../dto/elite-report.dto';
import { ProReportDto } from '../dto/pro-report.dto';
import { StandardReportDto } from '../dto/standard-report.dto';
import { ExportReportUseCase } from '../use-cases/export-report.use-case';
import { GetEliteReportUseCase } from '../use-cases/get-elite-report.use-case';
import { GetProReportUseCase } from '../use-cases/get-pro-report.use-case';
import { GetStandardReportUseCase } from '../use-cases/get-standard-report.use-case';

@ApiTags('reports')
@Controller('tenants/:tenantId/reports')
@UseGuards(
  BearerAuthGuard,
  TenantResolverGuard,
  TenantMembershipGuard,
  TenantRolesGuard,
  SubscriptionGuard,
)
@TenantRoles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.STAFF)
@ApiBearerAuth('bearer')
export class ReportController {
  constructor(
    private readonly getStandardReportUseCase: GetStandardReportUseCase,
    private readonly getProReportUseCase: GetProReportUseCase,
    private readonly getEliteReportUseCase: GetEliteReportUseCase,
    private readonly exportReportUseCase: ExportReportUseCase,
  ) {}

  @Get('standard')
  @RequiresPlan(PlanFeature.REPORTS_BASIC)
  @ApiOperation({ summary: 'Relatório STANDARD (mês atual)' })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiResponse({ status: 200, type: StandardReportDto })
  async getStandard(@Param('tenantId') tenantId: string) {
    return this.getStandardReportUseCase.run(tenantId);
  }

  @Get('pro')
  @RequiresPlan(PlanFeature.REPORTS_INTERMEDIATE)
  @ApiOperation({
    summary:
      'Relatório PRO (janela configurável até 3 meses + breakdown mensal)',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description:
      'Quantidade de meses (1–3). Default 3. Ex.: 1 = mês atual; 3 = últimos 3 meses.',
  })
  @ApiResponse({ status: 200, type: ProReportDto })
  async getPro(
    @Param('tenantId') tenantId: string,
    @Query('months') months?: string,
  ) {
    return this.getProReportUseCase.run(tenantId, months);
  }

  @Get('elite')
  @RequiresPlan(PlanFeature.REPORTS_ADVANCED)
  @ApiOperation({
    summary:
      'Relatório ELITE (janela configurável + breakdown por profissional)',
  })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description:
      'Quantidade de meses (1–12). Default 6. Ex.: 1 = mês atual; 3 = últimos 3 meses; 6 = últimos 6 meses.',
  })
  @ApiResponse({ status: 200, type: EliteReportDto })
  async getElite(
    @Param('tenantId') tenantId: string,
    @Query('months') months?: string,
  ) {
    return this.getEliteReportUseCase.run(tenantId, months);
  }

  @Get('export')
  @RequiresPlan(PlanFeature.REPORT_EXPORT)
  @ApiOperation({ summary: 'Exporta relatório ELITE em PDF ou Excel' })
  @ApiParam({ name: 'tenantId', description: 'UUID do tenant' })
  @ApiQuery({
    name: 'format',
    required: true,
    enum: ['pdf', 'excel'],
    description: 'Formato do arquivo',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Mesma janela do GET /elite (1–12, default 6)',
  })
  @ApiResponse({ status: 200, description: 'Arquivo para download' })
  @Header('Content-Disposition', 'attachment')
  async export(
    @Param('tenantId') tenantId: string,
    @Query('format') format: string,
    @Query('months') months?: string,
  ): Promise<StreamableFile> {
    const result = await this.exportReportUseCase.run(tenantId, format, months);

    return new StreamableFile(result.buffer, {
      type: result.contentType,
      disposition: `attachment; filename="${result.filename}"`,
    });
  }
}
