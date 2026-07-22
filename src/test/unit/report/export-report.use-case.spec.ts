import { Test, TestingModule } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { ExportReportUseCase } from 'src/modules/report/use-cases/export-report.use-case';
import { GetEliteReportUseCase } from 'src/modules/report/use-cases/get-elite-report.use-case';
import { FindTenantByIdUseCase } from 'src/modules/tenant/use-cases/find-tenant-by-id.use-case';
import { BusinessRuleException } from 'src/common/exceptions/business-rule.exception';

jest.mock('src/modules/report/utils/report-export.utils', () => ({
  buildExcelReport: jest.fn(),
  buildPdfReport: jest.fn(),
  buildReportFilename: jest.fn(),
  buildReportExportContext: jest.fn(),
}));

import {
  buildExcelReport,
  buildPdfReport,
  buildReportExportContext,
  buildReportFilename,
} from 'src/modules/report/utils/report-export.utils';

describe('ExportReportUseCase', () => {
  let useCase: ExportReportUseCase;
  const getEliteReport = { run: jest.fn() };
  const findTenantById = { run: jest.fn() };
  const eliteReport = {
    period: { start: new Date(), end: new Date() },
    revenue: 100,
    confirmedBookings: 1,
    cancelledBookings: 0,
    dashboard: {
      revenue: 100,
      confirmedBookings: 1,
      cancelledBookings: 0,
      cancellationRate: 0,
      averageTicket: 100,
      newCustomers: 1,
      returningCustomers: 0,
    },
    topServices: [],
    monthlyBreakdown: [],
    professionalBreakdown: [],
    insights: null,
  };
  const exportCtx = { filename: 'relatorio-barbearia-x-2026-06.pdf' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportReportUseCase,
        { provide: GetEliteReportUseCase, useValue: getEliteReport },
        { provide: FindTenantByIdUseCase, useValue: findTenantById },
      ],
    }).compile();

    useCase = module.get(ExportReportUseCase);
    findTenantById.run.mockResolvedValue({
      id: 'tenant-1',
      name: 'Barbearia X',
      slug: 'barbearia-x',
      timezone: 'America/Sao_Paulo',
    });
    getEliteReport.run.mockResolvedValue(eliteReport);
    (buildReportFilename as jest.Mock).mockReturnValue(
      'relatorio-barbearia-x-2026-06.pdf',
    );
    (buildReportExportContext as jest.Mock).mockReturnValue(exportCtx);
    (buildPdfReport as jest.Mock).mockResolvedValue({
      buffer: Buffer.from('pdf'),
      contentType: 'application/pdf',
      filename: 'relatorio-barbearia-x-2026-06.pdf',
    });
    (buildExcelReport as jest.Mock).mockResolvedValue({
      buffer: Buffer.from('xlsx'),
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'relatorio-barbearia-x-2026-06.xlsx',
    });

    jest
      .spyOn(DateTime, 'now')
      .mockReturnValue(
        DateTime.fromObject(
          { year: 2026, month: 6, day: 4 },
          { zone: 'America/Sao_Paulo' },
        ) as DateTime<true>,
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exporta PDF com contexto do estabelecimento', async () => {
    const result = await useCase.run('tenant-1', 'pdf');

    expect(getEliteReport.run).toHaveBeenCalledWith('tenant-1', undefined);
    expect(buildReportExportContext).toHaveBeenCalledWith(
      expect.objectContaining({
        report: eliteReport,
        tenantName: 'Barbearia X',
        tenantSlug: 'barbearia-x',
        timezone: 'America/Sao_Paulo',
      }),
    );
    expect(buildPdfReport).toHaveBeenCalledWith(exportCtx);
    expect(result.contentType).toBe('application/pdf');
  });

  it('repassa months ao relatório elite', async () => {
    await useCase.run('tenant-1', 'excel', 3);
    expect(getEliteReport.run).toHaveBeenCalledWith('tenant-1', 3);
  });

  it('exporta Excel', async () => {
    (buildReportFilename as jest.Mock).mockReturnValue(
      'relatorio-barbearia-x-2026-06.xlsx',
    );

    const result = await useCase.run('tenant-1', 'EXCEL');

    expect(buildExcelReport).toHaveBeenCalledWith(exportCtx);
    expect(result.contentType).toContain('spreadsheetml');
  });

  it('rejeita formato inválido', async () => {
    await expect(useCase.run('tenant-1', 'csv')).rejects.toBeInstanceOf(
      BusinessRuleException,
    );
  });
});
