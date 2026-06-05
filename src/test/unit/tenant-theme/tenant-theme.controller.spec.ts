import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { TenantThemeController } from 'src/modules/tenant-theme/controllers/tenant-theme.controller';
import { GetTenantThemeUseCase } from 'src/modules/tenant-theme/use-cases/get-tenant-theme.use-case';
import { UpsertTenantThemeUseCase } from 'src/modules/tenant-theme/use-cases/upsert-tenant-theme.use-case';
import { DeleteTenantThemeUseCase } from 'src/modules/tenant-theme/use-cases/delete-tenant-theme.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { PlanName } from 'src/modules/subscription/enums/plan-name.enum';
import { buildValidThemeDto } from './tenant-theme.test-helpers';

describe('TenantThemeController (HTTP)', () => {
  let app: INestApplication;
  const tenantId = 'tenant-uuid';
  const getTenantThemeUseCase = { run: jest.fn() };
  const upsertTenantThemeUseCase = { run: jest.fn() };
  const deleteTenantThemeUseCase = { run: jest.fn() };

  const mockResponse = {
    tenantId,
    theme: null,
    plan: PlanName.FREE,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TenantThemeController],
      providers: [
        { provide: GetTenantThemeUseCase, useValue: getTenantThemeUseCase },
        { provide: UpsertTenantThemeUseCase, useValue: upsertTenantThemeUseCase },
        { provide: DeleteTenantThemeUseCase, useValue: deleteTenantThemeUseCase },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (ctx: {
          switchToHttp: () => { getRequest: () => object };
        }) => {
          const req = ctx.switchToHttp().getRequest() as {
            user?: { dbUser: { id: string } };
          };
          req.user = { dbUser: { id: 'user-1' } };
          return true;
        },
      })
      .overrideGuard(TenantResolverGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantMembershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantRolesGuard)
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
    getTenantThemeUseCase.run.mockResolvedValue(mockResponse);
  });

  it('GET /tenants/:tenantId/theme é público', async () => {
    await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/theme`)
      .expect(200)
      .expect((res) => {
        expect(res.body.tenantId).toBe(tenantId);
        expect(getTenantThemeUseCase.run).toHaveBeenCalledWith(tenantId);
      });
  });

  it('PUT /tenants/:tenantId/theme faz upsert e retorna resposta atualizada', async () => {
    const dto = buildValidThemeDto();
    const savedTheme = {
      ...dto,
      secoesLayout: dto.secoesLayout.map(({ id, tipo, visivel, ordem, variante }) => ({
        id,
        tipo,
        visivel,
        ordem,
        variante,
      })),
    };

    upsertTenantThemeUseCase.run.mockResolvedValue(savedTheme);
    getTenantThemeUseCase.run.mockResolvedValue({
      tenantId,
      theme: savedTheme,
      plan: PlanName.STANDARD,
    });

    await request(app.getHttpServer())
      .put(`/tenants/${tenantId}/theme`)
      .send(dto)
      .expect(200)
      .expect((res) => {
        expect(res.body.theme.corPrimaria).toBe('#111111');
        expect(upsertTenantThemeUseCase.run).toHaveBeenCalledWith(
          tenantId,
          dto,
          'user-1',
        );
      });
  });

  it('PUT sem usuário no request usa string vazia', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TenantThemeController],
      providers: [
        { provide: GetTenantThemeUseCase, useValue: getTenantThemeUseCase },
        { provide: UpsertTenantThemeUseCase, useValue: upsertTenantThemeUseCase },
        { provide: DeleteTenantThemeUseCase, useValue: deleteTenantThemeUseCase },
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
      .compile();

    const isolatedApp = moduleRef.createNestApplication();
    await isolatedApp.init();

    const dto = buildValidThemeDto();
    upsertTenantThemeUseCase.run.mockResolvedValue({
      ...dto,
      secoesLayout: dto.secoesLayout,
    });
    getTenantThemeUseCase.run.mockResolvedValue(mockResponse);

    await request(isolatedApp.getHttpServer())
      .put(`/tenants/${tenantId}/theme`)
      .send(dto)
      .expect(200);

    expect(upsertTenantThemeUseCase.run).toHaveBeenCalledWith(tenantId, dto, '');
    await isolatedApp.close();
  });

  it('DELETE /tenants/:tenantId/theme remove customização', async () => {
    deleteTenantThemeUseCase.run.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/tenants/${tenantId}/theme`)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe('Theme deleted successfully');
        expect(deleteTenantThemeUseCase.run).toHaveBeenCalledWith(
          tenantId,
          'user-1',
        );
      });
  });

  it('DELETE sem usuário no request usa string vazia', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TenantThemeController],
      providers: [
        { provide: GetTenantThemeUseCase, useValue: getTenantThemeUseCase },
        { provide: UpsertTenantThemeUseCase, useValue: upsertTenantThemeUseCase },
        { provide: DeleteTenantThemeUseCase, useValue: deleteTenantThemeUseCase },
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
      .compile();

    const isolatedApp = moduleRef.createNestApplication();
    await isolatedApp.init();
    deleteTenantThemeUseCase.run.mockResolvedValue(undefined);

    await request(isolatedApp.getHttpServer())
      .delete(`/tenants/${tenantId}/theme`)
      .expect(200);

    expect(deleteTenantThemeUseCase.run).toHaveBeenCalledWith(tenantId, '');
    await isolatedApp.close();
  });
});
