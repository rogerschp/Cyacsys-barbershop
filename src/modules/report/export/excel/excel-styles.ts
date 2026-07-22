import * as ExcelJS from 'exceljs';
import {
  formatDateTimeBr,
  formatMonthLabel,
  formatPeriodRange,
} from '../report-export.formatters';
import { ReportExportContext } from '../report-export.types';

export const EXCEL_COLORS = {
  headerFill: 'FF1F2937',
  headerFont: 'FFFFFFFF',
  kpiLabelFill: 'FFF3F4F6',
  border: 'FFD1D5DB',
  title: 'FF111827',
} as const;

export const moneyFormat = '"R$"#,##0.00';
export const percentFormat = '0.00%';
export const integerFormat = '#,##0';

export function styleHeaderRow(row: ExcelJS.Row, columnCount: number): void {
  row.font = { bold: true, color: { argb: EXCEL_COLORS.headerFont }, size: 11 };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: EXCEL_COLORS.headerFill },
  };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.height = 22;

  for (let col = 1; col <= columnCount; col++) {
    const cell = row.getCell(col);
    cell.border = thinBorder();
  }
}

export function thinBorder(): Partial<ExcelJS.Borders> {
  const edge: Partial<ExcelJS.Border> = {
    style: 'thin',
    color: { argb: EXCEL_COLORS.border },
  };
  return { top: edge, left: edge, bottom: edge, right: edge };
}

export function applyTableChrome(
  sheet: ExcelJS.Worksheet,
  headerRowNumber: number,
  columnCount: number,
): void {
  sheet.views = [{ state: 'frozen', ySplit: headerRowNumber }];
  sheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: columnCount },
  };
}

export function autofitColumns(
  sheet: ExcelJS.Worksheet,
  min = 12,
  max = 42,
): void {
  sheet.columns.forEach((column) => {
    let longest = min;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value;
      const text =
        value == null
          ? ''
          : typeof value === 'object' && 'text' in value
            ? String((value as { text: string }).text)
            : String(value);
      longest = Math.min(max, Math.max(longest, text.length + 2));
    });
    column.width = longest;
  });
}

export function applyDataRowBorders(
  sheet: ExcelJS.Worksheet,
  fromRow: number,
  toRow: number,
  columnCount: number,
): void {
  for (let r = fromRow; r <= toRow; r++) {
    for (let c = 1; c <= columnCount; c++) {
      sheet.getRow(r).getCell(c).border = thinBorder();
    }
  }
}

export function writeSheetTitleBlock(
  sheet: ExcelJS.Worksheet,
  ctx: ReportExportContext,
  sheetTitle: string,
): number {
  sheet.getCell('A1').value = ctx.productName;
  sheet.getCell('A1').font = {
    bold: true,
    size: 16,
    color: { argb: EXCEL_COLORS.title },
  };

  sheet.getCell('A2').value = sheetTitle;
  sheet.getCell('A2').font = { bold: true, size: 12 };

  sheet.getCell('A3').value = `Estabelecimento: ${ctx.tenantName}`;
  sheet.getCell('A4').value = `Plano: ${ctx.planLabel}`;
  sheet.getCell('A5').value =
    `Período: ${formatPeriodRange(ctx.report.period.start, ctx.report.period.end, ctx.timezone)}`;
  sheet.getCell('A6').value =
    `Gerado em: ${formatDateTimeBr(ctx.generatedAt, ctx.timezone)}`;

  for (let r = 3; r <= 6; r++) {
    sheet.getRow(r).font = { size: 10, color: { argb: 'FF374151' } };
  }

  return 8;
}

export { formatMonthLabel };
