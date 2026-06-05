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
}));

import {
  buildExcelReport,
  buildPdfReport,
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
    monthlyBreakdown: [],
    professionalBreakdown: [],
    insights: null,
  };

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
      slug: 'barbearia-x',
      timezone: 'America/Sao_Paulo',
    });
    getEliteReport.run.mockResolvedValue(eliteReport);
    (buildReportFilename as jest.Mock).mockReturnValue(
      'relatorio-barbearia-x-2026-06.pdf',
    );
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

    jest.spyOn(DateTime, 'now').mockReturnValue(
      DateTime.fromObject(
        { year: 2026, month: 6, day: 4 },
        { zone: 'America/Sao_Paulo' },
      ) as DateTime<true>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exporta PDF', async () => {
    const result = await useCase.run('tenant-1', 'pdf');

    expect(buildPdfReport).toHaveBeenCalledWith(
      eliteReport,
      'relatorio-barbearia-x-2026-06.pdf',
    );
    expect(result.contentType).toBe('application/pdf');
  });

  it('exporta Excel', async () => {
    (buildReportFilename as jest.Mock).mockReturnValue(
      'relatorio-barbearia-x-2026-06.xlsx',
    );

    const result = await useCase.run('tenant-1', 'EXCEL');

    expect(buildExcelReport).toHaveBeenCalled();
    expect(result.contentType).toContain('spreadsheetml');
  });

  it('rejeita formato inválido', async () => {
    await expect(useCase.run('tenant-1', 'csv')).rejects.toBeInstanceOf(
      BusinessRuleException,
    );
  });
});
