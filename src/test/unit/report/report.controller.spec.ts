import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { ReportController } from 'src/modules/report/controllers/report.controller';
import { GetStandardReportUseCase } from 'src/modules/report/use-cases/get-standard-report.use-case';
import { GetProReportUseCase } from 'src/modules/report/use-cases/get-pro-report.use-case';
import { GetEliteReportUseCase } from 'src/modules/report/use-cases/get-elite-report.use-case';
import { ExportReportUseCase } from 'src/modules/report/use-cases/export-report.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { SubscriptionGuard } from 'src/modules/subscription/guards/subscription.guard';

describe('ReportController (HTTP)', () => {
  let app: INestApplication;
  const tenantId = 'tenant-uuid';
  const getStandardReport = { run: jest.fn() };
  const getProReport = { run: jest.fn() };
  const getEliteReport = { run: jest.fn() };
  const exportReport = { run: jest.fn() };

  const standardReport = {
    period: { start: new Date(), end: new Date() },
    revenue: 1000,
    confirmedBookings: 20,
    cancelledBookings: 2,
    insights: null,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        { provide: GetStandardReportUseCase, useValue: getStandardReport },
        { provide: GetProReportUseCase, useValue: getProReport },
        { provide: GetEliteReportUseCase, useValue: getEliteReport },
        { provide: ExportReportUseCase, useValue: exportReport },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SubscriptionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /tenants/:tenantId/reports/standard', async () => {
    getStandardReport.run.mockResolvedValue(standardReport);

    await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/reports/standard`)
      .expect(200)
      .expect((res) => {
        expect(res.body.revenue).toBe(1000);
        expect(getStandardReport.run).toHaveBeenCalledWith(tenantId);
      });
  });

  it('GET /tenants/:tenantId/reports/pro', async () => {
    getProReport.run.mockResolvedValue({
      ...standardReport,
      monthlyBreakdown: [],
    });

    await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/reports/pro`)
      .expect(200)
      .expect((res) => {
        expect(res.body.monthlyBreakdown).toEqual([]);
        expect(getProReport.run).toHaveBeenCalledWith(tenantId);
      });
  });

  it('GET /tenants/:tenantId/reports/elite', async () => {
    getEliteReport.run.mockResolvedValue({
      ...standardReport,
      monthlyBreakdown: [],
      professionalBreakdown: [],
    });

    await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/reports/elite`)
      .expect(200)
      .expect((res) => {
        expect(res.body.professionalBreakdown).toEqual([]);
        expect(getEliteReport.run).toHaveBeenCalledWith(tenantId);
      });
  });

  it('GET /tenants/:tenantId/reports/export?format=pdf', async () => {
    exportReport.run.mockResolvedValue({
      buffer: Buffer.from('%PDF-test'),
      contentType: 'application/pdf',
      filename: 'relatorio-barbearia-x-2026-06.pdf',
    });

    await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/reports/export`)
      .query({ format: 'pdf' })
      .expect(200)
      .expect('Content-Type', /application\/pdf/)
      .expect((res) => {
        expect(exportReport.run).toHaveBeenCalledWith(tenantId, 'pdf');
        expect(Buffer.isBuffer(res.body) || typeof res.body === 'object').toBe(
          true,
        );
      });
  });

  it('GET /tenants/:tenantId/reports/export?format=excel', async () => {
    exportReport.run.mockResolvedValue({
      buffer: Buffer.from('PK-excel'),
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'relatorio-barbearia-x-2026-06.xlsx',
    });

    await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/reports/export`)
      .query({ format: 'excel' })
      .expect(200)
      .expect((res) => {
        expect(exportReport.run).toHaveBeenCalledWith(tenantId, 'excel');
      });
  });
});
