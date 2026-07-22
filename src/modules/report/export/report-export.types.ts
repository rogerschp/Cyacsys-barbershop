import type { Workbook } from 'exceljs';
import { EliteReportDto } from '../dto/elite-report.dto';
import type { PdfDoc } from './pdf/pdf-layout';

export type ReportExportFormat = 'pdf' | 'excel';

export interface ReportExportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

/**
 * Metadados de apresentação — não altera regras de negócio do relatório.
 * Extensível para futuras seções (insights, gráficos, forecast).
 */
export interface ReportExportContext {
  report: EliteReportDto;
  filename: string;
  tenantName: string;
  tenantSlug: string;
  planLabel: string;
  timezone: string;
  generatedAt: Date;
  reportVersion: string;
  productName: string;
  reportTitle: string;
}

/** Contrato para novas seções de export sem alterar builders existentes. */
export interface PdfExportSection {
  readonly id: string;
  append(doc: PdfDoc, ctx: ReportExportContext): void;
}

export interface ExcelExportSection {
  readonly id: string;
  append(workbook: Workbook, ctx: ReportExportContext): void;
}
