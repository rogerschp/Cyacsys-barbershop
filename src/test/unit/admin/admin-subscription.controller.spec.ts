import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import request = require('supertest');
import { Role } from 'src/common/enums/role.enum';
import { UserRolesGuard } from 'src/common/guards/user-roles.guard';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { AdminSubscriptionController } from 'src/modules/admin/controllers/admin-subscription.controller';
import { ActivateAdminSubscriptionUseCase } from 'src/modules/admin/use-cases/activate-admin-subscription.use-case';
import { ExpireAdminSubscriptionUseCase } from 'src/modules/admin/use-cases/expire-admin-subscription.use-case';
import { GetAdminSubscriptionHistoryUseCase } from 'src/modules/admin/use-cases/get-admin-subscription-history.use-case';
import { GetAdminSubscriptionUseCase } from 'src/modules/admin/use-cases/get-admin-subscription.use-case';
import { ListAdminSubscriptionsUseCase } from 'src/modules/admin/use-cases/list-admin-subscriptions.use-case';
import { BillingCycle } from 'src/modules/subscription/enums/billing-cycle.enum';
import { PlanName } from 'src/modules/subscription/enums/plan-name.enum';
import { SubscriptionStatus } from 'src/modules/subscription/enums/subscription-status.enum';
import { SubscriptionGuard } from 'src/modules/subscription/guards/subscription.guard';

describe('AdminSubscriptionController (HTTP)', () => {
  const adminUserId = 'admin-uuid';
  const listAdminSubscriptionsUseCase = { run: jest.fn() };
  const getAdminSubscriptionUseCase = { run: jest.fn() };
  const getAdminSubscriptionHistoryUseCase = { run: jest.fn() };
  const activateAdminSubscriptionUseCase = { run: jest.fn() };
  const expireAdminSubscriptionUseCase = { run: jest.fn() };

  const providers = [
    {
      provide: ListAdminSubscriptionsUseCase,
      useValue: listAdminSubscriptionsUseCase,
    },
    {
      provide: GetAdminSubscriptionUseCase,
      useValue: getAdminSubscriptionUseCase,
    },
    {
      provide: GetAdminSubscriptionHistoryUseCase,
      useValue: getAdminSubscriptionHistoryUseCase,
    },
    {
      provide: ActivateAdminSubscriptionUseCase,
      useValue: activateAdminSubscriptionUseCase,
    },
    {
      provide: ExpireAdminSubscriptionUseCase,
      useValue: expireAdminSubscriptionUseCase,
    },
  ];

  async function createApp(options?: {
    role?: Role;
    authenticated?: boolean;
    stubUserRolesGuard?: boolean;
  }): Promise<INestApplication> {
    const {
      role = Role.SUPER_ADMIN,
      authenticated = true,
      stubUserRolesGuard = false,
    } = options ?? {};

    let builder = Test.createTestingModule({
      controllers: [AdminSubscriptionController],
      providers: [...providers, Reflector, UserRolesGuard],
    })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (ctx: {
          switchToHttp: () => { getRequest: () => Record<string, unknown> };
        }) => {
          if (!authenticated) {
            return false;
          }
          const req = ctx.switchToHttp().getRequest();
          req.user = {
            dbUser: { id: adminUserId, role },
          };
          return true;
        },
      });

    if (stubUserRolesGuard) {
      builder = builder
        .overrideGuard(UserRolesGuard)
        .useValue({ canActivate: () => true });
    }

    const moduleRef = await builder.compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('não aplica guards de tenant nem SubscriptionGuard', () => {
    const guards =
      Reflect.getMetadata('__guards__', AdminSubscriptionController) ?? [];
    const guardNames = guards.map(
      (guard: { name?: string } | (new () => unknown)) =>
        typeof guard === 'function'
          ? guard.name
          : (guard as { name?: string }).name,
    );
    expect(guardNames).toEqual(
      expect.arrayContaining(['BearerAuthGuard', 'UserRolesGuard']),
    );
    expect(guardNames).not.toContain(TenantResolverGuard.name);
    expect(guardNames).not.toContain(TenantMembershipGuard.name);
    expect(guardNames).not.toContain(TenantRolesGuard.name);
    expect(guardNames).not.toContain(SubscriptionGuard.name);
  });

  describe('autorização (UserRolesGuard real)', () => {
    it('SUPER_ADMIN → 200/201', async () => {
      const app = await createApp({ role: Role.SUPER_ADMIN });
      listAdminSubscriptionsUseCase.run.mockResolvedValue({
        data: [],
        total: 0,
        first: 0,
        rows: 20,
        page: 1,
        pageCount: 0,
      });
      activateAdminSubscriptionUseCase.run.mockResolvedValue({
        id: 'sub-uuid',
        status: SubscriptionStatus.ACTIVE,
      });

      await request(app.getHttpServer())
        .get('/admin/subscriptions')
        .expect(200);
      await request(app.getHttpServer())
        .post('/admin/subscriptions/activate')
        .send({
          tenantId: '550e8400-e29b-41d4-a716-446655440000',
          planName: PlanName.PRO,
          billingCycle: BillingCycle.MONTHLY,
        })
        .expect(201);

      await app.close();
    });

    it.each([
      Role.ADMIN,
      Role.BARBER,
      Role.CLIENT,
      Role.MANAGER,
      Role.RECEPTIONIST,
    ])('%s → 403', async (role) => {
      const app = await createApp({ role });
      await request(app.getHttpServer())
        .get('/admin/subscriptions')
        .expect(403);
      await app.close();
    });

    it('usuário sem autenticação → 401', async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [AdminSubscriptionController],
        providers: [...providers, Reflector, UserRolesGuard],
      })
        .overrideGuard(BearerAuthGuard)
        .useValue({
          canActivate: (ctx: {
            switchToHttp: () => { getRequest: () => Record<string, unknown> };
          }) => {
            const req = ctx.switchToHttp().getRequest();
            req.user = undefined;
            return true;
          },
        })
        .compile();

      const app = moduleRef.createNestApplication();
      await app.init();

      await request(app.getHttpServer())
        .get('/admin/subscriptions')
        .expect(401);

      await app.close();
    });
  });

  describe('cross-tenant (SUPER_ADMIN sem membership)', () => {
    it('consulta e ativa assinatura de tenant sem depender de tenant_users', async () => {
      const app = await createApp({
        role: Role.SUPER_ADMIN,
        stubUserRolesGuard: true,
      });
      const tenantId = 'tenant-a-uuid';
      getAdminSubscriptionUseCase.run.mockResolvedValue({
        tenant: { id: tenantId, name: 'A', slug: 'a', status: 'ACTIVE' },
        subscription: {
          id: 'sub-a',
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          gracePeriodEnd: null,
        },
        plan: {
          id: 'plan-pro',
          name: PlanName.PRO,
          billingCycle: BillingCycle.MONTHLY,
        },
      });
      activateAdminSubscriptionUseCase.run.mockResolvedValue({
        id: 'sub-a',
        tenantId,
        status: SubscriptionStatus.ACTIVE,
      });

      await request(app.getHttpServer())
        .get(`/admin/subscriptions/${tenantId}`)
        .expect(200)
        .expect(() => {
          expect(getAdminSubscriptionUseCase.run).toHaveBeenCalledWith(
            tenantId,
          );
        });

      await request(app.getHttpServer())
        .post('/admin/subscriptions/activate')
        .send({
          tenantId,
          planName: PlanName.PRO,
          billingCycle: BillingCycle.MONTHLY,
        })
        .expect(201)
        .expect(() => {
          expect(activateAdminSubscriptionUseCase.run).toHaveBeenCalledWith(
            {
              tenantId,
              planName: PlanName.PRO,
              billingCycle: BillingCycle.MONTHLY,
            },
            adminUserId,
          );
        });

      await app.close();
    });
  });

  describe('endpoints', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createApp({ stubUserRolesGuard: true });
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /admin/subscriptions lista com first/rows', async () => {
      listAdminSubscriptionsUseCase.run.mockResolvedValue({
        data: [],
        total: 0,
        first: 0,
        rows: 20,
        page: 1,
        pageCount: 0,
      });

      await request(app.getHttpServer())
        .get('/admin/subscriptions')
        .query({ first: 0, rows: 20 })
        .expect(200)
        .expect(() => {
          expect(listAdminSubscriptionsUseCase.run).toHaveBeenCalled();
        });
    });

    it('GET /admin/subscriptions/:tenantId/history', async () => {
      getAdminSubscriptionHistoryUseCase.run.mockResolvedValue([
        {
          id: 'hist-1',
          subscriptionId: 'sub-1',
          tenantId: 'tenant-1',
          event: 'CREATED',
          fromPlanId: null,
          toPlanId: 'plan-1',
          performedBy: 'system',
          createdAt: new Date().toISOString(),
        },
      ]);

      await request(app.getHttpServer())
        .get('/admin/subscriptions/tenant-1/history')
        .expect(200)
        .expect(() => {
          expect(getAdminSubscriptionHistoryUseCase.run).toHaveBeenCalledWith(
            'tenant-1',
          );
        });
    });

    it('POST /admin/subscriptions/expire-now', async () => {
      expireAdminSubscriptionUseCase.run.mockResolvedValue({
        expiredCount: 2,
      });

      await request(app.getHttpServer())
        .post('/admin/subscriptions/expire-now')
        .expect(201)
        .expect((res) => {
          expect(res.body.expiredCount).toBe(2);
          expect(expireAdminSubscriptionUseCase.run).toHaveBeenCalled();
        });
    });

    it('usa activatedBy vazio quando usuário não está no request', async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [AdminSubscriptionController],
        providers,
      })
        .overrideGuard(BearerAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(UserRolesGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const isolatedApp = moduleRef.createNestApplication();
      await isolatedApp.init();

      const dto = {
        tenantId: 'tenant-uuid',
        planName: PlanName.PRO,
        billingCycle: BillingCycle.ANNUAL,
      };
      activateAdminSubscriptionUseCase.run.mockResolvedValue({ id: 'sub-2' });

      await request(isolatedApp.getHttpServer())
        .post('/admin/subscriptions/activate')
        .send(dto)
        .expect(201);

      expect(activateAdminSubscriptionUseCase.run).toHaveBeenCalledWith(
        dto,
        '',
      );
      await isolatedApp.close();
    });
  });
});
