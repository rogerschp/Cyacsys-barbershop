import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { BusinessRuleException } from '../../../common/exceptions/business-rule.exception';
import { FindTenantByIdUseCase } from '../../tenant/use-cases/find-tenant-by-id.use-case';
import {
  buildExcelReport,
  buildPdfReport,
  buildReportExportContext,
  buildReportFilename,
  ReportExportFormat,
  ReportExportResult,
} from '../utils/report-export.utils';
import { GetEliteReportUseCase } from './get-elite-report.use-case';

@Injectable()
export class ExportReportUseCase {
  constructor(
    private readonly getEliteReportUseCase: GetEliteReportUseCase,
    private readonly findTenantByIdUseCase: FindTenantByIdUseCase,
  ) {}

  async run(
    tenantId: string,
    format: string | undefined,
    months?: string | number,
  ): Promise<ReportExportResult> {
    const normalizedFormat = this.normalizeFormat(format);
    const [tenant, report] = await Promise.all([
      this.findTenantByIdUseCase.run(tenantId),
      this.getEliteReportUseCase.run(tenantId, months),
    ]);

    const now = DateTime.now().setZone(tenant.timezone);
    const filename = buildReportFilename(
      tenant.slug,
      now.year,
      now.month,
      normalizedFormat,
    );

    const ctx = buildReportExportContext({
      report,
      filename,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      timezone: tenant.timezone,
      generatedAt: now.toJSDate(),
    });

    if (normalizedFormat === 'pdf') {
      return buildPdfReport(ctx);
    }

    return buildExcelReport(ctx);
  }

  private normalizeFormat(format: string | undefined): ReportExportFormat {
    const value = format?.toLowerCase();
    if (value === 'pdf' || value === 'excel') {
      return value;
    }

    throw new BusinessRuleException(
      'INVALID_REPORT_EXPORT_FORMAT',
      "Formato de exportação inválido. Use 'pdf' ou 'excel'.",
      { format },
    );
  }
}
