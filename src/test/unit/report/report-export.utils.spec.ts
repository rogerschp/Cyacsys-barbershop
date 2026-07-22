import {
  buildExcelReport,
  buildPdfReport,
  buildReportExportContext,
  buildReportFilename,
} from 'src/modules/report/utils/report-export.utils';
import { EliteReportDto } from 'src/modules/report/dto/elite-report.dto';
import * as ExcelJS from 'exceljs';

const eliteReport: EliteReportDto = {
  period: {
    start: new Date('2026-04-01T03:00:00.000Z'),
    end: new Date('2026-06-04T23:59:59.999Z'),
  },
  revenue: 3000,
  confirmedBookings: 80,
  cancelledBookings: 5,
  dashboard: {
    revenue: 3000,
    confirmedBookings: 80,
    cancelledBookings: 5,
    cancellationRate: 5.88,
    averageTicket: 37.5,
    newCustomers: 7,
    returningCustomers: 12,
  },
  topServices: [
    {
      serviceId: 's1',
      serviceName: 'Corte',
      quantity: 40,
      revenue: 2000,
    },
  ],
  monthlyBreakdown: [
    {
      year: 2026,
      month: 5,
      revenue: 1200,
      confirmedBookings: 30,
      cancelledBookings: 2,
      revenueChangePercent: null,
    },
    {
      year: 2026,
      month: 6,
      revenue: 1800,
      confirmedBookings: 50,
      cancelledBookings: 3,
      revenueChangePercent: 50,
    },
  ],
  professionalBreakdown: [
    {
      tenantProfessionalId: 'tp-1',
      professionalName: 'João',
      revenue: 2000,
      confirmedBookings: 55,
      cancelledBookings: 2,
      averageTicket: 36.36,
      cancellationRate: 3.51,
    },
  ],
  insights: null,
};

function buildCtx(filename: string) {
  return buildReportExportContext({
    report: eliteReport,
    filename,
    tenantName: 'Barbearia X',
    tenantSlug: 'barbearia-x',
    timezone: 'America/Sao_Paulo',
    generatedAt: new Date('2026-06-04T15:00:00.000Z'),
  });
}

describe('report-export.utils', () => {
  it('buildReportFilename gera nomes pdf e xlsx', () => {
    expect(buildReportFilename('barbearia-x', 2026, 6, 'pdf')).toBe(
      'relatorio-barbearia-x-2026-06.pdf',
    );
    expect(buildReportFilename('barbearia-x', 2026, 6, 'excel')).toBe(
      'relatorio-barbearia-x-2026-06.xlsx',
    );
  });

  it('buildExcelReport retorna workbook profissional com 4 abas', async () => {
    const result = await buildExcelReport(
      buildCtx('relatorio-barbearia-x-2026-06.xlsx'),
    );

    expect(result.filename).toBe('relatorio-barbearia-x-2026-06.xlsx');
    expect(result.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.buffer.subarray(0, 2).toString()).toBe('PK');

    const workbook = new ExcelJS.Workbook();
    // exceljs tipagens divergem entre Buffer do Node e Buffer genérico
    await workbook.xlsx.load(result.buffer as unknown as ExcelJS.Buffer);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Dashboard',
      'Receita Mensal',
      'Profissionais',
      'Top Serviços',
    ]);

    const dashboard = workbook.getWorksheet('Dashboard');
    expect(dashboard?.getCell('A1').value).toBe('Cyacsys');
    expect(dashboard?.getCell('A8').value).toBe('Indicador');
    expect(dashboard?.getCell('B9').value).toBe(3000);
  });

  it('buildPdfReport retorna buffer pdf com metadados Cyacsys', async () => {
    const result = await buildPdfReport(
      buildCtx('relatorio-barbearia-x-2026-06.pdf'),
    );

    expect(result.filename).toBe('relatorio-barbearia-x-2026-06.pdf');
    expect(result.contentType).toBe('application/pdf');
    expect(result.buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(result.buffer.length).toBeGreaterThan(1000);
  });
});
