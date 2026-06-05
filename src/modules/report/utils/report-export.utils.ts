import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import { EliteReportDto } from '../dto/elite-report.dto';

export type ReportExportFormat = 'pdf' | 'excel';

export interface ReportExportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return '-';
  }
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

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

export async function buildExcelReport(
  report: EliteReportDto,
  filename: string,
): Promise<ReportExportResult> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cyacsys Barbershop';

  const summarySheet = workbook.addWorksheet('Resumo');
  summarySheet.addRow([
    'Período',
    `${report.period.start} — ${report.period.end}`,
  ]);
  summarySheet.addRow(['Faturamento total', report.revenue]);
  summarySheet.addRow(['Bookings confirmados', report.confirmedBookings]);
  summarySheet.addRow(['Bookings cancelados', report.cancelledBookings]);

  const monthlySheet = workbook.addWorksheet('Por mês');
  monthlySheet.addRow([
    'Ano',
    'Mês',
    'Faturamento',
    'Confirmados',
    'Cancelados',
    'Variação %',
  ]);
  for (const month of report.monthlyBreakdown) {
    monthlySheet.addRow([
      month.year,
      month.month,
      month.revenue,
      month.confirmedBookings,
      month.cancelledBookings,
      month.revenueChangePercent,
    ]);
  }

  const professionalSheet = workbook.addWorksheet('Por profissional');
  professionalSheet.addRow([
    'Profissional',
    'Faturamento',
    'Confirmados',
    'Cancelados',
  ]);
  for (const professional of report.professionalBreakdown) {
    professionalSheet.addRow([
      professional.professionalName,
      professional.revenue,
      professional.confirmedBookings,
      professional.cancelledBookings,
    ]);
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  return {
    buffer,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename,
  };
}

export async function buildPdfReport(
  report: EliteReportDto,
  filename: string,
): Promise<ReportExportResult> {
  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const endPromise = new Promise<void>((resolve) => {
    doc.on('end', () => resolve());
  });

  doc.fontSize(18).text('Relatório Elite', { underline: true });
  doc.moveDown();
  doc
    .fontSize(12)
    .text(`Período: ${report.period.start} — ${report.period.end}`);
  doc.text(`Faturamento total: R$ ${formatCurrency(report.revenue)}`);
  doc.text(`Bookings confirmados: ${report.confirmedBookings}`);
  doc.text(`Bookings cancelados: ${report.cancelledBookings}`);
  doc.moveDown();

  doc.fontSize(14).text('Faturamento por mês');
  doc.moveDown(0.5);
  for (const month of report.monthlyBreakdown) {
    doc
      .fontSize(11)
      .text(
        `${month.month}/${month.year} — R$ ${formatCurrency(month.revenue)} | Confirmados: ${month.confirmedBookings} | Cancelados: ${month.cancelledBookings} | Variação: ${formatPercent(month.revenueChangePercent)}`,
      );
  }

  doc.moveDown();
  doc.fontSize(14).text('Faturamento por profissional');
  doc.moveDown(0.5);
  for (const professional of report.professionalBreakdown) {
    doc
      .fontSize(11)
      .text(
        `${professional.professionalName} — R$ ${formatCurrency(professional.revenue)} | Confirmados: ${professional.confirmedBookings} | Cancelados: ${professional.cancelledBookings}`,
      );
  }

  doc.end();
  await endPromise;

  return {
    buffer: Buffer.concat(chunks),
    contentType: 'application/pdf',
    filename,
  };
}
