import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { AdminSubscriptionController } from 'src/modules/subscription/controllers/admin-subscription.controller';
import { ActivateSubscriptionUseCase } from 'src/modules/subscription/use-cases/activate-subscription.use-case';
import { ExpireSubscriptionsUseCase } from 'src/modules/subscription/use-cases/expire-subscriptions.use-case';
import { BearerAuthGuard } from 'src/modules/auth/guards/bearer-auth.guard';
import { UserRolesGuard } from 'src/common/guards/user-roles.guard';
import { PlanName } from 'src/modules/subscription/enums/plan-name.enum';
import { BillingCycle } from 'src/modules/subscription/enums/billing-cycle.enum';
import { SubscriptionStatus } from 'src/modules/subscription/enums/subscription-status.enum';

describe('AdminSubscriptionController (HTTP)', () => {
  let app: INestApplication;
  const activateSubscriptionUseCase = { run: jest.fn() };
  const expireSubscriptionsUseCase = { run: jest.fn() };
  const adminUserId = 'admin-uuid';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminSubscriptionController],
      providers: [
        {
          provide: ActivateSubscriptionUseCase,
          useValue: activateSubscriptionUseCase,
        },
        {
          provide: ExpireSubscriptionsUseCase,
          useValue: expireSubscriptionsUseCase,
        },
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
          req.user = { dbUser: { id: adminUserId } };
          return true;
        },
      })
      .overrideGuard(UserRolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /admin/subscriptions/activate ativa assinatura', async () => {
    const dto = {
      tenantId: 'tenant-uuid',
      planName: PlanName.STANDARD,
      billingCycle: BillingCycle.MONTHLY,
    };
    activateSubscriptionUseCase.run.mockResolvedValue({
      id: 'sub-uuid',
      tenantId: dto.tenantId,
      status: SubscriptionStatus.ACTIVE,
      plan: { name: PlanName.STANDARD },
    });

    await request(app.getHttpServer())
      .post('/admin/subscriptions/activate')
      .send(dto)
      .expect(201)
      .expect(() => {
        expect(activateSubscriptionUseCase.run).toHaveBeenCalledWith(
          dto,
          adminUserId,
        );
      });
  });

  it('POST /admin/subscriptions/expire-now processa expiração', async () => {
    expireSubscriptionsUseCase.run.mockResolvedValue({ expiredCount: 2 });

    await request(app.getHttpServer())
      .post('/admin/subscriptions/expire-now')
      .expect(201)
      .expect((res) => {
        expect(res.body.expiredCount).toBe(2);
        expect(expireSubscriptionsUseCase.run).toHaveBeenCalled();
      });
  });

  it('usa activatedBy vazio quando usuário não está no request', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminSubscriptionController],
      providers: [
        {
          provide: ActivateSubscriptionUseCase,
          useValue: activateSubscriptionUseCase,
        },
        {
          provide: ExpireSubscriptionsUseCase,
          useValue: expireSubscriptionsUseCase,
        },
      ],
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
    activateSubscriptionUseCase.run.mockResolvedValue({ id: 'sub-2' });

    await request(isolatedApp.getHttpServer())
      .post('/admin/subscriptions/activate')
      .send(dto)
      .expect(201);

    expect(activateSubscriptionUseCase.run).toHaveBeenCalledWith(dto, '');
    await isolatedApp.close();
  });
});
