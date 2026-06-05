import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TenantThemeController } from '../modules/tenant-theme/controllers/tenant-theme.controller';
import { GetTenantThemeUseCase } from '../modules/tenant-theme/use-cases/get-tenant-theme.use-case';
import { UpsertTenantThemeUseCase } from '../modules/tenant-theme/use-cases/upsert-tenant-theme.use-case';
import { DeleteTenantThemeUseCase } from '../modules/tenant-theme/use-cases/delete-tenant-theme.use-case';
import { BearerAuthGuard } from '../modules/auth/guards/bearer-auth.guard';
import { TenantResolverGuard } from '../common/guards/tenant-resolver.guard';
import { TenantMembershipGuard } from '../common/guards/tenant-membership.guard';
import { TenantRolesGuard } from '../common/guards/tenant-roles.guard';
import { PlanName } from '../modules/subscription/enums/plan-name.enum';
import { buildValidThemeDto } from './unit/tenant-theme/tenant-theme.test-helpers';

describe('TenantThemeController (e2e)', () => {
  let app: INestApplication;
  let getTenantThemeUseCase: jest.Mocked<GetTenantThemeUseCase>;
  let upsertTenantThemeUseCase: jest.Mocked<UpsertTenantThemeUseCase>;
  let deleteTenantThemeUseCase: jest.Mocked<DeleteTenantThemeUseCase>;

  const tenantId = 'tenant-e2e-uuid';

  beforeAll(async () => {
    const mockGet = { run: jest.fn() };
    const mockUpsert = { run: jest.fn() };
    const mockDelete = { run: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TenantThemeController],
      providers: [
        { provide: GetTenantThemeUseCase, useValue: mockGet },
        { provide: UpsertTenantThemeUseCase, useValue: mockUpsert },
        { provide: DeleteTenantThemeUseCase, useValue: mockDelete },
      ],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          const req = context.switchToHttp().getRequest();
          req.user = { dbUser: { id: 'user-e2e-123' }, uid: 'firebase-uid' };
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

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    getTenantThemeUseCase = moduleFixture.get(
      GetTenantThemeUseCase,
    ) as jest.Mocked<GetTenantThemeUseCase>;
    upsertTenantThemeUseCase = moduleFixture.get(
      UpsertTenantThemeUseCase,
    ) as jest.Mocked<UpsertTenantThemeUseCase>;
    deleteTenantThemeUseCase = moduleFixture.get(
      DeleteTenantThemeUseCase,
    ) as jest.Mocked<DeleteTenantThemeUseCase>;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getTenantThemeUseCase.run.mockResolvedValue({
      tenantId,
      theme: null,
      plan: PlanName.FREE,
    });
  });

  describe('GET /tenants/:tenantId/theme', () => {
    it('deve retornar 200 com theme e plan', () => {
      return request(app.getHttpServer())
        .get(`/tenants/${tenantId}/theme`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tenantId', tenantId);
          expect(res.body).toHaveProperty('plan', PlanName.FREE);
          expect(getTenantThemeUseCase.run).toHaveBeenCalledWith(tenantId);
        });
    });
  });

  describe('PUT /tenants/:tenantId/theme', () => {
    it('deve retornar 200 quando payload é válido', async () => {
      const dto = buildValidThemeDto();
      const savedTheme = {
        ...dto,
        secoesLayout: dto.secoesLayout.map(
          ({ id, tipo, visivel, ordem, variante }) => ({
            id,
            tipo,
            visivel,
            ordem,
            variante,
          }),
        ),
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
            expect.objectContaining({ corPrimaria: '#111111' }),
            'user-e2e-123',
          );
        });
    });

    it('deve retornar 400 quando cor primária é inválida', () => {
      const dto = buildValidThemeDto({ corPrimaria: 'invalid' });

      return request(app.getHttpServer())
        .put(`/tenants/${tenantId}/theme`)
        .send(dto)
        .expect(400);
    });

    it('deve retornar 400 quando secoesLayout não tem 6 itens', () => {
      const dto = buildValidThemeDto({
        secoesLayout: buildValidThemeDto().secoesLayout.slice(0, 5),
      });

      return request(app.getHttpServer())
        .put(`/tenants/${tenantId}/theme`)
        .send(dto)
        .expect(400);
    });
  });

  describe('DELETE /tenants/:tenantId/theme', () => {
    it('deve retornar 200 e mensagem de sucesso', () => {
      deleteTenantThemeUseCase.run.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .delete(`/tenants/${tenantId}/theme`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Theme deleted successfully');
          expect(deleteTenantThemeUseCase.run).toHaveBeenCalledWith(
            tenantId,
            'user-e2e-123',
          );
        });
    });
  });
});
