import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';
import { ReportController } from './controllers/report.controller';
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
    GetStandardReportUseCase,
    GetProReportUseCase,
    GetEliteReportUseCase,
    ExportReportUseCase,
  ],
})
export class ReportModule {}
