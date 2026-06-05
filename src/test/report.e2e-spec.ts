import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ReportController } from '../modules/report/controllers/report.controller';
import { GetStandardReportUseCase } from '../modules/report/use-cases/get-standard-report.use-case';
import { GetProReportUseCase } from '../modules/report/use-cases/get-pro-report.use-case';
import { GetEliteReportUseCase } from '../modules/report/use-cases/get-elite-report.use-case';
import { ExportReportUseCase } from '../modules/report/use-cases/export-report.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { TenantResolverGuard } from '../common/guards/tenant-resolver.guard';
import { TenantMembershipGuard } from '../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../common/guards/tenant-roles.guard';
import { SubscriptionGuard } from '../modules/subscription/guards/subscription.guard';
import { TenantUserRole } from '../modules/tenant-user/entities/tenant-user-role.enum';
import { BusinessRuleException } from '../common/exceptions/business-rule.exception';

describe('ReportController (e2e)', () => {
  let app: INestApplication;
  let getStandardReportUseCase: jest.Mocked<GetStandardReportUseCase>;
  let getProReportUseCase: jest.Mocked<GetProReportUseCase>;
  let getEliteReportUseCase: jest.Mocked<GetEliteReportUseCase>;
  let exportReportUseCase: jest.Mocked<ExportReportUseCase>;

  const tenantId = 'tenant-e2e-uuid';
  const basePath = `/tenants/${tenantId}/reports`;

  const standardReport = {
    period: {
      start: '2026-06-01T03:00:00.000Z',
      end: '2026-06-04T23:59:59.999Z',
    },
    revenue: 2500,
    confirmedBookings: 45,
    cancelledBookings: 3,
    insights: null,
  };

  beforeAll(async () => {
    const mocks = {
      standard: { run: jest.fn() },
      pro: { run: jest.fn() },
      elite: { run: jest.fn() },
      export: { run: jest.fn() },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        { provide: GetStandardReportUseCase, useValue: mocks.standard },
        { provide: GetProReportUseCase, useValue: mocks.pro },
        { provide: GetEliteReportUseCase, useValue: mocks.elite },
        { provide: ExportReportUseCase, useValue: mocks.export },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => object };
        }) => {
          const req = context.switchToHttp().getRequest() as {
            user?: { dbUser: { id: string } };
            tenantMembership?: { role: TenantUserRole };
          };
          req.user = { dbUser: { id: 'user-e2e-123' } };
          req.tenantMembership = { role: TenantUserRole.STAFF };
          return true;
        },
      })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SubscriptionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    getStandardReportUseCase = moduleFixture.get(
      GetStandardReportUseCase,
    ) as jest.Mocked<GetStandardReportUseCase>;
    getProReportUseCase = moduleFixture.get(
      GetProReportUseCase,
    ) as jest.Mocked<GetProReportUseCase>;
    getEliteReportUseCase = moduleFixture.get(
      GetEliteReportUseCase,
    ) as jest.Mocked<GetEliteReportUseCase>;
    exportReportUseCase = moduleFixture.get(
      ExportReportUseCase,
    ) as jest.Mocked<ExportReportUseCase>;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getStandardReportUseCase.run.mockResolvedValue(standardReport as never);
    getProReportUseCase.run.mockResolvedValue({
      ...standardReport,
      monthlyBreakdown: [],
    } as never);
    getEliteReportUseCase.run.mockResolvedValue({
      ...standardReport,
      monthlyBreakdown: [],
      professionalBreakdown: [],
    } as never);
    exportReportUseCase.run.mockResolvedValue({
      buffer: Buffer.from('%PDF-e2e'),
      contentType: 'application/pdf',
      filename: 'relatorio-barbearia-x-2026-06.pdf',
    });
  });

  it(`GET ${basePath}/standard retorna relatório do mês`, () => {
    return request(app.getHttpServer())
      .get(`${basePath}/standard`)
      .expect(200)
      .expect((res) => {
        expect(res.body.revenue).toBe(2500);
        expect(getStandardReportUseCase.run).toHaveBeenCalledWith(tenantId);
      });
  });

  it(`GET ${basePath}/pro retorna relatório PRO`, () => {
    return request(app.getHttpServer())
      .get(`${basePath}/pro`)
      .expect(200)
      .expect((res) => {
        expect(res.body.monthlyBreakdown).toEqual([]);
        expect(getProReportUseCase.run).toHaveBeenCalledWith(tenantId);
      });
  });

  it(`GET ${basePath}/elite retorna relatório ELITE`, () => {
    return request(app.getHttpServer())
      .get(`${basePath}/elite`)
      .expect(200)
      .expect((res) => {
        expect(res.body.professionalBreakdown).toEqual([]);
        expect(getEliteReportUseCase.run).toHaveBeenCalledWith(tenantId);
      });
  });

  it(`GET ${basePath}/export?format=pdf retorna arquivo`, () => {
    return request(app.getHttpServer())
      .get(`${basePath}/export`)
      .query({ format: 'pdf' })
      .expect(200)
      .expect((res) => {
        expect(exportReportUseCase.run).toHaveBeenCalledWith(tenantId, 'pdf');
      });
  });

  it(`GET ${basePath}/export?format=excel retorna arquivo`, () => {
    exportReportUseCase.run.mockResolvedValue({
      buffer: Buffer.from('PK-e2e'),
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'relatorio-barbearia-x-2026-06.xlsx',
    });

    return request(app.getHttpServer())
      .get(`${basePath}/export`)
      .query({ format: 'excel' })
      .expect(200)
      .expect((res) => {
        expect(exportReportUseCase.run).toHaveBeenCalledWith(tenantId, 'excel');
      });
  });

  it(`GET ${basePath}/export com formato inválido propaga erro`, () => {
    exportReportUseCase.run.mockRejectedValue(
      new BusinessRuleException(
        'INVALID_REPORT_EXPORT_FORMAT',
        "Formato de exportação inválido. Use 'pdf' ou 'excel'.",
      ),
    );

    return request(app.getHttpServer())
      .get(`${basePath}/export`)
      .query({ format: 'csv' })
      .expect(400);
  });
});
