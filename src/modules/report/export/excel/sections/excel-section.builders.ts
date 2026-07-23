import * as ExcelJS from 'exceljs';
import {
  ExcelExportSection,
  ReportExportContext,
} from '../../report-export.types';
import {
  applyDataRowBorders,
  applyTableChrome,
  autofitColumns,
  EXCEL_COLORS,
  integerFormat,
  moneyFormat,
  percentFormat,
  styleHeaderRow,
  thinBorder,
  writeSheetTitleBlock,
  formatMonthLabel,
} from '../excel-styles';

export class DashboardSectionBuilder implements ExcelExportSection {
  readonly id = 'dashboard';

  append(workbook: ExcelJS.Workbook, ctx: ReportExportContext): void {
    const sheet = workbook.addWorksheet('Dashboard', {
      properties: { defaultRowHeight: 18 },
    });
    const startRow = writeSheetTitleBlock(
      sheet,
      ctx,
      'Dashboard — Indicadores',
    );

    const kpis: Array<{
      label: string;
      value: number | string;
      numFmt?: string;
    }> = [
      {
        label: 'Receita',
        value: ctx.report.dashboard.revenue,
        numFmt: moneyFormat,
      },
      {
        label: 'Confirmados',
        value: ctx.report.dashboard.confirmedBookings,
        numFmt: integerFormat,
      },
      {
        label: 'Cancelados',
        value: ctx.report.dashboard.cancelledBookings,
        numFmt: integerFormat,
      },
      {
        label: 'Ticket médio',
        value: ctx.report.dashboard.averageTicket,
        numFmt: moneyFormat,
      },
      {
        label: 'Taxa de cancelamento',
        value: ctx.report.dashboard.cancellationRate / 100,
        numFmt: percentFormat,
      },
      {
        label: 'Clientes novos',
        value: ctx.report.dashboard.newCustomers,
        numFmt: integerFormat,
      },
      {
        label: 'Clientes recorrentes',
        value: ctx.report.dashboard.returningCustomers,
        numFmt: integerFormat,
      },
    ];

    const headerRow = sheet.getRow(startRow);
    headerRow.values = ['Indicador', 'Valor'];
    styleHeaderRow(headerRow, 2);

    kpis.forEach((kpi, index) => {
      const rowNumber = startRow + 1 + index;
      const row = sheet.getRow(rowNumber);
      row.getCell(1).value = kpi.label;
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXCEL_COLORS.kpiLabelFill },
      };
      row.getCell(1).font = { bold: true, size: 11 };
      row.getCell(1).border = thinBorder();

      row.getCell(2).value = kpi.value;
      if (kpi.numFmt) {
        row.getCell(2).numFmt = kpi.numFmt;
      }
      row.getCell(2).alignment = { horizontal: 'right' };
      row.getCell(2).font = { bold: true, size: 12 };
      row.getCell(2).border = thinBorder();
      row.height = 24;
    });

    sheet.getColumn(1).width = 28;
    sheet.getColumn(2).width = 18;
  }
}

export class MonthlyRevenueSectionBuilder implements ExcelExportSection {
  readonly id = 'monthly-revenue';

  append(workbook: ExcelJS.Workbook, ctx: ReportExportContext): void {
    const sheet = workbook.addWorksheet('Receita Mensal');
    const startRow = writeSheetTitleBlock(sheet, ctx, 'Receita Mensal');
    const headerRowNumber = startRow;
    const header = sheet.getRow(headerRowNumber);
    header.values = ['Mês', 'Receita', 'Confirmados', 'Cancelados', 'Variação'];
    styleHeaderRow(header, 5);

    ctx.report.monthlyBreakdown.forEach((month, index) => {
      const row = sheet.getRow(headerRowNumber + 1 + index);
      row.values = [
        formatMonthLabel(month.year, month.month),
        month.revenue,
        month.confirmedBookings,
        month.cancelledBookings,
        month.revenueChangePercent == null
          ? null
          : month.revenueChangePercent / 100,
      ];
      row.getCell(2).numFmt = moneyFormat;
      row.getCell(3).numFmt = integerFormat;
      row.getCell(4).numFmt = integerFormat;
      row.getCell(5).numFmt = percentFormat;
      row.getCell(2).alignment = { horizontal: 'right' };
      row.getCell(3).alignment = { horizontal: 'right' };
      row.getCell(4).alignment = { horizontal: 'right' };
      row.getCell(5).alignment = { horizontal: 'right' };
    });

    const lastDataRow =
      headerRowNumber + Math.max(ctx.report.monthlyBreakdown.length, 0);
    if (ctx.report.monthlyBreakdown.length > 0) {
      applyDataRowBorders(sheet, headerRowNumber + 1, lastDataRow, 5);
    }
    applyTableChrome(sheet, headerRowNumber, 5);
    autofitColumns(sheet);
  }
}

export class ProfessionalSectionBuilder implements ExcelExportSection {
  readonly id = 'professionals';

  append(workbook: ExcelJS.Workbook, ctx: ReportExportContext): void {
    const sheet = workbook.addWorksheet('Profissionais');
    const startRow = writeSheetTitleBlock(
      sheet,
      ctx,
      'Receita por Profissional',
    );
    const headerRowNumber = startRow;
    const header = sheet.getRow(headerRowNumber);
    header.values = [
      'Profissional',
      'Receita',
      'Atendimentos',
      'Ticket Médio',
      'Cancelamentos',
    ];
    styleHeaderRow(header, 5);

    const professionals = [...ctx.report.professionalBreakdown].sort(
      (a, b) => b.revenue - a.revenue,
    );

    professionals.forEach((professional, index) => {
      const row = sheet.getRow(headerRowNumber + 1 + index);
      row.values = [
        professional.professionalName,
        professional.revenue,
        professional.confirmedBookings,
        professional.averageTicket,
        professional.cancelledBookings,
      ];
      row.getCell(2).numFmt = moneyFormat;
      row.getCell(3).numFmt = integerFormat;
      row.getCell(4).numFmt = moneyFormat;
      row.getCell(5).numFmt = integerFormat;
      row.getCell(2).alignment = { horizontal: 'right' };
      row.getCell(3).alignment = { horizontal: 'right' };
      row.getCell(4).alignment = { horizontal: 'right' };
      row.getCell(5).alignment = { horizontal: 'right' };
    });

    if (professionals.length > 0) {
      applyDataRowBorders(
        sheet,
        headerRowNumber + 1,
        headerRowNumber + professionals.length,
        5,
      );
    }
    applyTableChrome(sheet, headerRowNumber, 5);
    autofitColumns(sheet);
  }
}

export class ServiceSectionBuilder implements ExcelExportSection {
  readonly id = 'top-services';

  append(workbook: ExcelJS.Workbook, ctx: ReportExportContext): void {
    const sheet = workbook.addWorksheet('Top Serviços');
    const startRow = writeSheetTitleBlock(sheet, ctx, 'Top Serviços');
    const headerRowNumber = startRow;
    const header = sheet.getRow(headerRowNumber);
    header.values = ['Serviço', 'Quantidade', 'Receita'];
    styleHeaderRow(header, 3);

    const services = [...ctx.report.topServices].sort(
      (a, b) => b.quantity - a.quantity,
    );

    services.forEach((service, index) => {
      const row = sheet.getRow(headerRowNumber + 1 + index);
      row.values = [service.serviceName, service.quantity, service.revenue];
      row.getCell(2).numFmt = integerFormat;
      row.getCell(3).numFmt = moneyFormat;
      row.getCell(2).alignment = { horizontal: 'right' };
      row.getCell(3).alignment = { horizontal: 'right' };
    });

    if (services.length > 0) {
      applyDataRowBorders(
        sheet,
        headerRowNumber + 1,
        headerRowNumber + services.length,
        3,
      );
    }
    applyTableChrome(sheet, headerRowNumber, 3);
    autofitColumns(sheet);
  }
}
