import { EliteReportDto } from '../dto/elite-report.dto';
import { ExcelReportBuilder } from '../export/excel/excel-report.builder';
import { PdfReportBuilder } from '../export/pdf/pdf-report.builder';
import {
  REPORT_EXPORT_PLAN_LABEL,
  REPORT_EXPORT_PRODUCT_NAME,
  REPORT_EXPORT_TITLE,
  REPORT_EXPORT_VERSION,
} from '../export/report-export.constants';
import {
  ReportExportContext,
  ReportExportFormat,
  ReportExportResult,
} from '../export/report-export.types';

export type { ReportExportFormat, ReportExportResult, ReportExportContext };

export function buildReportFilename(
  tenantSlug: string,
  year: number,
  month: number,
  format: ReportExportFormat,
): string {
  const monthPadded = String(month).padStart(2, '0');
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  return `relatorio-${tenantSlug}-${year}-${monthPadded}.${extension}`;
}

export function buildReportExportContext(params: {
  report: EliteReportDto;
  filename: string;
  tenantName: string;
  tenantSlug: string;
  timezone: string;
  generatedAt: Date;
  planLabel?: string;
}): ReportExportContext {
  return {
    report: params.report,
    filename: params.filename,
    tenantName: params.tenantName,
    tenantSlug: params.tenantSlug,
    timezone: params.timezone,
    generatedAt: params.generatedAt,
    planLabel: params.planLabel ?? REPORT_EXPORT_PLAN_LABEL,
    reportVersion: REPORT_EXPORT_VERSION,
    productName: REPORT_EXPORT_PRODUCT_NAME,
    reportTitle: REPORT_EXPORT_TITLE,
  };
}

export async function buildExcelReport(
  ctx: ReportExportContext,
): Promise<ReportExportResult> {
  return new ExcelReportBuilder().build(ctx);
}

export async function buildPdfReport(
  ctx: ReportExportContext,
): Promise<ReportExportResult> {
  return new PdfReportBuilder().build(ctx);
}
