import {
  buildExcelReport,
  buildPdfReport,
  buildReportFilename,
} from 'src/modules/report/utils/report-export.utils';
import { EliteReportDto } from 'src/modules/report/dto/elite-report.dto';

const eliteReport: EliteReportDto = {
  period: {
    start: new Date('2026-04-01T03:00:00.000Z'),
    end: new Date('2026-06-04T23:59:59.999Z'),
  },
  revenue: 3000,
  confirmedBookings: 80,
  cancelledBookings: 5,
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
    },
  ],
  insights: null,
};

describe('report-export.utils', () => {
  it('buildReportFilename gera nomes pdf e xlsx', () => {
    expect(buildReportFilename('barbearia-x', 2026, 6, 'pdf')).toBe(
      'relatorio-barbearia-x-2026-06.pdf',
    );
    expect(buildReportFilename('barbearia-x', 2026, 6, 'excel')).toBe(
      'relatorio-barbearia-x-2026-06.xlsx',
    );
  });

  it('buildExcelReport retorna buffer xlsx', async () => {
    const result = await buildExcelReport(
      eliteReport,
      'relatorio-barbearia-x-2026-06.xlsx',
    );

    expect(result.filename).toBe('relatorio-barbearia-x-2026-06.xlsx');
    expect(result.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.buffer.subarray(0, 2).toString()).toBe('PK');
  });

  it('buildPdfReport retorna buffer pdf', async () => {
    const result = await buildPdfReport(
      eliteReport,
      'relatorio-barbearia-x-2026-06.pdf',
    );

    expect(result.filename).toBe('relatorio-barbearia-x-2026-06.pdf');
    expect(result.contentType).toBe('application/pdf');
    expect(result.buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
