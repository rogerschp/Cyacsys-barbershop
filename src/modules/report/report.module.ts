import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { ReportController } from './controllers/report.controller';
import { CustomerMetricsService } from './domain/customer-metrics.service';
import { DashboardMetricsService } from './domain/dashboard-metrics.service';
import { ProfessionalMetricsService } from './domain/professional-metrics.service';
import { RevenueCalculator } from './domain/revenue.calculator';
import { ServiceMetricsService } from './domain/service-metrics.service';
import { ReportService } from './services/report.service';
import { ExportReportUseCase } from './use-cases/export-report.use-case';
import { GetEliteReportUseCase } from './use-cases/get-elite-report.use-case';
import { GetProReportUseCase } from './use-cases/get-pro-report.use-case';
import { GetStandardReportUseCase } from './use-cases/get-standard-report.use-case';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => TenantModule),
    forwardRef(() => TenantUserModule),
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [ReportController],
  providers: [
    RevenueCalculator,
    DashboardMetricsService,
    CustomerMetricsService,
    ServiceMetricsService,
    ProfessionalMetricsService,
    ReportService,
    GetStandardReportUseCase,
    GetProReportUseCase,
    GetEliteReportUseCase,
    ExportReportUseCase,
  ],
})
export class ReportModule {}
