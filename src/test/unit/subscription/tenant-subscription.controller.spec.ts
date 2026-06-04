import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { TenantSubscriptionController } from 'src/modules/subscription/controllers/tenant-subscription.controller';
import { GetTenantSubscriptionUseCase } from 'src/modules/subscription/use-cases/get-tenant-subscription.use-case';
import { GetSubscriptionHistoryUseCase } from 'src/modules/subscription/use-cases/get-subscription-history.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { TenantResolverGuard } from 'src/common/guards/tenant-resolver.guard';
import { TenantMembershipGuard } from 'src/common/guards/tenant-membership.guard';
import { TenantRolesGuard } from 'src/common/guards/tenant-roles.guard';
import { SubscriptionStatus } from 'src/modules/subscription/enums/subscription-status.enum';
import { PlanName } from 'src/modules/subscription/enums/plan-name.enum';
import { BillingCycle } from 'src/modules/subscription/enums/billing-cycle.enum';

describe('TenantSubscriptionController (HTTP)', () => {
  let app: INestApplication;
  const tenantId = 'tenant-uuid';
  const getTenantSubscriptionUseCase = { run: jest.fn() };
  const getSubscriptionHistoryUseCase = { run: jest.fn() };

  const mockSubscription = {
    id: 'sub-uuid',
    tenantId,
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    gracePeriodEnd: null,
    cancelledAt: null,
    plan: {
      id: 'plan-uuid',
      name: PlanName.FREE,
      billingCycle: BillingCycle.NONE,
      price: '0.00',
      sortWeight: 0,
      gracePeriodDays: 0,
      features: {},
      isActive: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TenantSubscriptionController],
      providers: [
        {
          provide: GetTenantSubscriptionUseCase,
          useValue: getTenantSubscriptionUseCase,
        },
        {
          provide: GetSubscriptionHistoryUseCase,
          useValue: getSubscriptionHistoryUseCase,
        },
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

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /tenants/:tenantId/subscription retorna assinatura', async () => {
    getTenantSubscriptionUseCase.run.mockResolvedValue(mockSubscription);

    await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/subscription`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe('sub-uuid');
        expect(getTenantSubscriptionUseCase.run).toHaveBeenCalledWith(tenantId);
      });
  });

  it('GET /tenants/:tenantId/subscription/history retorna histórico', async () => {
    getSubscriptionHistoryUseCase.run.mockResolvedValue([
      {
        id: 'hist-1',
        event: 'CREATED',
        fromPlanId: null,
        toPlanId: 'plan-uuid',
        performedBy: 'user-uuid',
        createdAt: new Date().toISOString(),
      },
    ]);

    await request(app.getHttpServer())
      .get(`/tenants/${tenantId}/subscription/history`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(getSubscriptionHistoryUseCase.run).toHaveBeenCalledWith(tenantId);
      });
  });
});
